using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Ajandam.Application.DTOs.Sync;
using Ajandam.Core.Entities;
using Ajandam.Infrastructure.Data;

namespace Ajandam.API.Services;

public class BackgroundSyncService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;
    private readonly SyncTokenStore _tokenStore;
    private readonly ILogger<BackgroundSyncService> _logger;
    private readonly HttpClient _http;
    private readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public BackgroundSyncService(
        IServiceProvider services,
        IConfiguration config,
        SyncTokenStore tokenStore,
        ILogger<BackgroundSyncService> logger,
        IHttpClientFactory httpFactory)
    {
        _services = services;
        _config = config;
        _tokenStore = tokenStore;
        _logger = logger;
        _http = httpFactory.CreateClient("SyncClient");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var remoteUrl = _config["Sync:RemoteUrl"];
        if (string.IsNullOrWhiteSpace(remoteUrl))
        {
            _logger.LogInformation("Sync disabled: no RemoteUrl configured.");
            return;
        }

        _http.BaseAddress = new Uri(remoteUrl.TrimEnd('/'));
        var intervalSec = _config.GetValue("Sync:IntervalSeconds", 30);

        _logger.LogInformation("Sync service started. Remote: {Url}, Interval: {Sec}s", remoteUrl, intervalSec);

        // Wait a bit for app to start
        await Task.Delay(5000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoSync(stoppingToken);
            }
            catch (Exception ex)
            {
                _tokenStore.IsOnline = false;
                _logger.LogWarning("Sync failed: {Message}", ex.Message);
            }

            await Task.Delay(TimeSpan.FromSeconds(intervalSec), stoppingToken);
        }
    }

    private async Task DoSync(CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_tokenStore.RemoteToken) || _tokenStore.UserId == null)
        {
            _tokenStore.IsOnline = false;
            return;
        }

        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _tokenStore.RemoteToken);

        // 1) Pull remote changes
        var pullReq = new SyncPullRequest { Since = _tokenStore.LastSyncedAt };
        var pullJson = new StringContent(
            JsonSerializer.Serialize(pullReq, _jsonOpts), Encoding.UTF8, "application/json");

        var pullResponse = await _http.PostAsync("/api/sync/pull", pullJson, ct);

        if (!pullResponse.IsSuccessStatusCode)
        {
            if (pullResponse.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                _tokenStore.RemoteToken = null;
                _tokenStore.IsOnline = false;
                _logger.LogWarning("Remote token expired. User needs to re-login.");
            }
            return;
        }

        _tokenStore.IsOnline = true;

        var pullContent = await pullResponse.Content.ReadAsStringAsync(ct);
        var remotePayload = JsonSerializer.Deserialize<SyncPayload>(pullContent, _jsonOpts);
        if (remotePayload == null) return;

        // 2) Apply remote changes to local DB
        using (var scope = _services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AjandamDbContext>();
            await ApplyRemoteChanges(db, remotePayload, _tokenStore.UserId.Value, ct);
        }

        // 3) Push local changes to remote
        SyncPayload localPayload;
        using (var scope = _services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AjandamDbContext>();
            localPayload = await BuildLocalPayload(db, _tokenStore.UserId.Value, _tokenStore.LastSyncedAt, ct);
        }

        var pushJson = new StringContent(
            JsonSerializer.Serialize(localPayload, _jsonOpts), Encoding.UTF8, "application/json");
        var pushResponse = await _http.PostAsync("/api/sync/push", pushJson, ct);

        if (pushResponse.IsSuccessStatusCode)
        {
            _tokenStore.LastSyncedAt = DateTime.UtcNow;
            _tokenStore.SaveState();
            _logger.LogInformation("Sync completed. Pulled {P}, Pushed {U} items.",
                CountPayload(remotePayload), CountPayload(localPayload));
        }
    }

    private async Task ApplyRemoteChanges(AjandamDbContext db, SyncPayload remote, Guid userId, CancellationToken ct)
    {
        // Tags
        foreach (var dto in remote.Tags)
        {
            var existing = await db.Tags.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == dto.Id, ct);
            if (existing == null)
            {
                db.Tags.Add(new Tag
                {
                    Id = dto.Id, Name = dto.Name, Color = dto.Color,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                });
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Name = dto.Name; existing.Color = dto.Color;
                existing.IsDeleted = dto.IsDeleted; existing.UpdatedAt = dto.UpdatedAt;
            }
        }

        // Tasks
        foreach (var dto in remote.Tasks)
        {
            var existing = await db.TodoTasks.IgnoreQueryFilters()
                .Include(t => t.TodoTaskTags)
                .FirstOrDefaultAsync(t => t.Id == dto.Id, ct);

            if (existing == null)
            {
                var task = new TodoTask
                {
                    Id = dto.Id, Title = dto.Title, Description = dto.Description,
                    Priority = dto.Priority, Status = dto.Status,
                    DueDate = dto.DueDate, StartDate = dto.StartDate, EndDate = dto.EndDate,
                    RecurrenceType = dto.RecurrenceType, RecurrenceInterval = dto.RecurrenceInterval,
                    RecurrenceEndDate = dto.RecurrenceEndDate, ParentTaskId = dto.ParentTaskId,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                };
                foreach (var tagId in dto.TagIds)
                    task.TodoTaskTags.Add(new TodoTaskTag { TodoTaskId = task.Id, TagId = tagId });
                db.TodoTasks.Add(task);
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Title = dto.Title; existing.Description = dto.Description;
                existing.Priority = dto.Priority; existing.Status = dto.Status;
                existing.DueDate = dto.DueDate; existing.StartDate = dto.StartDate; existing.EndDate = dto.EndDate;
                existing.RecurrenceType = dto.RecurrenceType; existing.RecurrenceInterval = dto.RecurrenceInterval;
                existing.RecurrenceEndDate = dto.RecurrenceEndDate; existing.ParentTaskId = dto.ParentTaskId;
                existing.IsDeleted = dto.IsDeleted; existing.UpdatedAt = dto.UpdatedAt;
                existing.TodoTaskTags.Clear();
                foreach (var tagId in dto.TagIds)
                    existing.TodoTaskTags.Add(new TodoTaskTag { TodoTaskId = existing.Id, TagId = tagId });
            }
        }

        // Notes
        foreach (var dto in remote.Notes)
        {
            var existing = await db.Notes.IgnoreQueryFilters().FirstOrDefaultAsync(n => n.Id == dto.Id, ct);
            if (existing == null)
                db.Notes.Add(new Note { Id = dto.Id, Title = dto.Title, Content = dto.Content, Date = dto.Date, UserId = userId, IsDeleted = dto.IsDeleted, CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt });
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            { existing.Title = dto.Title; existing.Content = dto.Content; existing.Date = dto.Date; existing.IsDeleted = dto.IsDeleted; existing.UpdatedAt = dto.UpdatedAt; }
        }

        // Journal
        foreach (var dto in remote.JournalEntries)
        {
            var existing = await db.JournalEntries.IgnoreQueryFilters().FirstOrDefaultAsync(j => j.Id == dto.Id, ct);
            if (existing == null)
                db.JournalEntries.Add(new JournalEntry { Id = dto.Id, Content = dto.Content, Date = dto.Date, Mood = dto.Mood, UserId = userId, IsDeleted = dto.IsDeleted, CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt });
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            { existing.Content = dto.Content; existing.Date = dto.Date; existing.Mood = dto.Mood; existing.IsDeleted = dto.IsDeleted; existing.UpdatedAt = dto.UpdatedAt; }
        }

        // Countdowns
        foreach (var dto in remote.Countdowns)
        {
            var existing = await db.Countdowns.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == dto.Id, ct);
            if (existing == null)
                db.Countdowns.Add(new Countdown { Id = dto.Id, Title = dto.Title, TargetDate = dto.TargetDate, IsActive = dto.IsActive, UserId = userId, IsDeleted = dto.IsDeleted, CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt });
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            { existing.Title = dto.Title; existing.TargetDate = dto.TargetDate; existing.IsActive = dto.IsActive; existing.IsDeleted = dto.IsDeleted; existing.UpdatedAt = dto.UpdatedAt; }
        }

        // Templates
        foreach (var dto in remote.Templates)
        {
            var existing = await db.TaskTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == dto.Id, ct);
            if (existing == null)
                db.TaskTemplates.Add(new TaskTemplate { Id = dto.Id, Name = dto.Name, Title = dto.Title, Description = dto.Description, Priority = dto.Priority, DefaultTags = dto.DefaultTags, UserId = userId, IsDeleted = dto.IsDeleted, CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt });
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            { existing.Name = dto.Name; existing.Title = dto.Title; existing.Description = dto.Description; existing.Priority = dto.Priority; existing.DefaultTags = dto.DefaultTags; existing.IsDeleted = dto.IsDeleted; existing.UpdatedAt = dto.UpdatedAt; }
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<SyncPayload> BuildLocalPayload(AjandamDbContext db, Guid userId, DateTime? since, CancellationToken ct)
    {
        var s = since ?? DateTime.MinValue;
        var payload = new SyncPayload { ServerTime = DateTime.UtcNow };

        var tasks = await db.TodoTasks.IgnoreQueryFilters().Include(t => t.TodoTaskTags)
            .Where(t => t.UserId == userId && (t.CreatedAt > s || t.UpdatedAt > s)).ToListAsync(ct);
        payload.Tasks = tasks.Select(t => new SyncTaskDto
        {
            Id = t.Id, Title = t.Title, Description = t.Description,
            Priority = t.Priority, Status = t.Status,
            DueDate = t.DueDate, StartDate = t.StartDate, EndDate = t.EndDate,
            RecurrenceType = t.RecurrenceType, RecurrenceInterval = t.RecurrenceInterval,
            RecurrenceEndDate = t.RecurrenceEndDate, ParentTaskId = t.ParentTaskId,
            TagIds = t.TodoTaskTags.Select(tt => tt.TagId).ToList(),
            IsDeleted = t.IsDeleted, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
        }).ToList();

        var tags = await db.Tags.IgnoreQueryFilters().Where(t => t.UserId == userId && (t.CreatedAt > s || t.UpdatedAt > s)).ToListAsync(ct);
        payload.Tags = tags.Select(t => new SyncTagDto { Id = t.Id, Name = t.Name, Color = t.Color, IsDeleted = t.IsDeleted, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt }).ToList();

        var notes = await db.Notes.IgnoreQueryFilters().Where(n => n.UserId == userId && (n.CreatedAt > s || n.UpdatedAt > s)).ToListAsync(ct);
        payload.Notes = notes.Select(n => new SyncNoteDto { Id = n.Id, Title = n.Title, Content = n.Content, Date = n.Date, IsDeleted = n.IsDeleted, CreatedAt = n.CreatedAt, UpdatedAt = n.UpdatedAt }).ToList();

        var journals = await db.JournalEntries.IgnoreQueryFilters().Where(j => j.UserId == userId && (j.CreatedAt > s || j.UpdatedAt > s)).ToListAsync(ct);
        payload.JournalEntries = journals.Select(j => new SyncJournalDto { Id = j.Id, Content = j.Content, Date = j.Date, Mood = j.Mood, IsDeleted = j.IsDeleted, CreatedAt = j.CreatedAt, UpdatedAt = j.UpdatedAt }).ToList();

        var countdowns = await db.Countdowns.IgnoreQueryFilters().Where(c => c.UserId == userId && (c.CreatedAt > s || c.UpdatedAt > s)).ToListAsync(ct);
        payload.Countdowns = countdowns.Select(c => new SyncCountdownDto { Id = c.Id, Title = c.Title, TargetDate = c.TargetDate, IsActive = c.IsActive, IsDeleted = c.IsDeleted, CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt }).ToList();

        var templates = await db.TaskTemplates.IgnoreQueryFilters().Where(t => t.UserId == userId && (t.CreatedAt > s || t.UpdatedAt > s)).ToListAsync(ct);
        payload.Templates = templates.Select(t => new SyncTemplateDto { Id = t.Id, Name = t.Name, Title = t.Title, Description = t.Description, Priority = t.Priority, DefaultTags = t.DefaultTags, IsDeleted = t.IsDeleted, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt }).ToList();

        return payload;
    }

    private static bool IsNewer(DateTime? incomingUpdated, DateTime incomingCreated, DateTime? existingUpdated, DateTime existingCreated)
    {
        var incoming = incomingUpdated ?? incomingCreated;
        var existing = existingUpdated ?? existingCreated;
        return incoming > existing;
    }

    private static int CountPayload(SyncPayload p) =>
        p.Tasks.Count + p.Tags.Count + p.Notes.Count + p.JournalEntries.Count + p.Countdowns.Count + p.Templates.Count;
}

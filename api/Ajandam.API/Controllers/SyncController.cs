using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ajandam.Application.DTOs.Sync;
using Ajandam.Core.Entities;
using Ajandam.Infrastructure.Data;

namespace Ajandam.API.Controllers;

[Route("api/sync")]
[Authorize]
public class SyncController : BaseController
{
    private readonly AjandamDbContext _db;

    public SyncController(AjandamDbContext db) => _db = db;

    /// <summary>
    /// Pull: returns all user entities modified after 'since' (including soft-deleted).
    /// </summary>
    [HttpPost("pull")]
    public async Task<ActionResult<SyncPayload>> Pull([FromBody] SyncPullRequest request)
    {
        var userId = GetUserId();
        var since = request.Since ?? DateTime.MinValue;

        var payload = new SyncPayload { ServerTime = DateTime.UtcNow };

        // Tasks (IgnoreQueryFilters to include soft-deleted)
        var tasks = await _db.TodoTasks
            .IgnoreQueryFilters()
            .Include(t => t.TodoTaskTags)
            .Where(t => t.UserId == userId && (t.CreatedAt > since || t.UpdatedAt > since))
            .ToListAsync();

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

        // Tags
        var tags = await _db.Tags
            .IgnoreQueryFilters()
            .Where(t => t.UserId == userId && (t.CreatedAt > since || t.UpdatedAt > since))
            .ToListAsync();

        payload.Tags = tags.Select(t => new SyncTagDto
        {
            Id = t.Id, Name = t.Name, Color = t.Color,
            IsDeleted = t.IsDeleted, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
        }).ToList();

        // Notes
        var notes = await _db.Notes
            .IgnoreQueryFilters()
            .Where(n => n.UserId == userId && (n.CreatedAt > since || n.UpdatedAt > since))
            .ToListAsync();

        payload.Notes = notes.Select(n => new SyncNoteDto
        {
            Id = n.Id, Title = n.Title, Content = n.Content, Date = n.Date,
            IsDeleted = n.IsDeleted, CreatedAt = n.CreatedAt, UpdatedAt = n.UpdatedAt,
        }).ToList();

        // Journal
        var journals = await _db.JournalEntries
            .IgnoreQueryFilters()
            .Where(j => j.UserId == userId && (j.CreatedAt > since || j.UpdatedAt > since))
            .ToListAsync();

        payload.JournalEntries = journals.Select(j => new SyncJournalDto
        {
            Id = j.Id, Content = j.Content, Date = j.Date, Mood = j.Mood,
            IsDeleted = j.IsDeleted, CreatedAt = j.CreatedAt, UpdatedAt = j.UpdatedAt,
        }).ToList();

        // Countdowns
        var countdowns = await _db.Countdowns
            .IgnoreQueryFilters()
            .Where(c => c.UserId == userId && (c.CreatedAt > since || c.UpdatedAt > since))
            .ToListAsync();

        payload.Countdowns = countdowns.Select(c => new SyncCountdownDto
        {
            Id = c.Id, Title = c.Title, TargetDate = c.TargetDate, IsActive = c.IsActive,
            IsDeleted = c.IsDeleted, CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt,
        }).ToList();

        // Templates
        var templates = await _db.TaskTemplates
            .IgnoreQueryFilters()
            .Where(t => t.UserId == userId && (t.CreatedAt > since || t.UpdatedAt > since))
            .ToListAsync();

        payload.Templates = templates.Select(t => new SyncTemplateDto
        {
            Id = t.Id, Name = t.Name, Title = t.Title, Description = t.Description,
            Priority = t.Priority, DefaultTags = t.DefaultTags,
            IsDeleted = t.IsDeleted, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
        }).ToList();

        return Ok(payload);
    }

    /// <summary>
    /// Push: receives entities from another instance, merges using last-write-wins.
    /// </summary>
    [HttpPost("push")]
    public async Task<ActionResult<SyncPayload>> Push([FromBody] SyncPayload payload)
    {
        var userId = GetUserId();

        // Merge Tags first (tasks reference them)
        foreach (var dto in payload.Tags)
        {
            var existing = await _db.Tags.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == dto.Id && t.UserId == userId);
            if (existing == null)
            {
                _db.Tags.Add(new Tag
                {
                    Id = dto.Id, Name = dto.Name, Color = dto.Color,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                });
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Name = dto.Name;
                existing.Color = dto.Color;
                existing.IsDeleted = dto.IsDeleted;
                existing.UpdatedAt = dto.UpdatedAt;
            }
        }

        // Merge Tasks
        foreach (var dto in payload.Tasks)
        {
            var existing = await _db.TodoTasks.IgnoreQueryFilters()
                .Include(t => t.TodoTaskTags)
                .FirstOrDefaultAsync(t => t.Id == dto.Id && t.UserId == userId);

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
                _db.TodoTasks.Add(task);
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Title = dto.Title;
                existing.Description = dto.Description;
                existing.Priority = dto.Priority;
                existing.Status = dto.Status;
                existing.DueDate = dto.DueDate;
                existing.StartDate = dto.StartDate;
                existing.EndDate = dto.EndDate;
                existing.RecurrenceType = dto.RecurrenceType;
                existing.RecurrenceInterval = dto.RecurrenceInterval;
                existing.RecurrenceEndDate = dto.RecurrenceEndDate;
                existing.ParentTaskId = dto.ParentTaskId;
                existing.IsDeleted = dto.IsDeleted;
                existing.UpdatedAt = dto.UpdatedAt;

                // Replace tag associations
                existing.TodoTaskTags.Clear();
                foreach (var tagId in dto.TagIds)
                    existing.TodoTaskTags.Add(new TodoTaskTag { TodoTaskId = existing.Id, TagId = tagId });
            }
        }

        // Merge Notes
        foreach (var dto in payload.Notes)
        {
            var existing = await _db.Notes.IgnoreQueryFilters().FirstOrDefaultAsync(n => n.Id == dto.Id && n.UserId == userId);
            if (existing == null)
            {
                _db.Notes.Add(new Note
                {
                    Id = dto.Id, Title = dto.Title, Content = dto.Content, Date = dto.Date,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                });
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Title = dto.Title;
                existing.Content = dto.Content;
                existing.Date = dto.Date;
                existing.IsDeleted = dto.IsDeleted;
                existing.UpdatedAt = dto.UpdatedAt;
            }
        }

        // Merge Journal
        foreach (var dto in payload.JournalEntries)
        {
            var existing = await _db.JournalEntries.IgnoreQueryFilters().FirstOrDefaultAsync(j => j.Id == dto.Id && j.UserId == userId);
            if (existing == null)
            {
                _db.JournalEntries.Add(new JournalEntry
                {
                    Id = dto.Id, Content = dto.Content, Date = dto.Date, Mood = dto.Mood,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                });
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Content = dto.Content;
                existing.Date = dto.Date;
                existing.Mood = dto.Mood;
                existing.IsDeleted = dto.IsDeleted;
                existing.UpdatedAt = dto.UpdatedAt;
            }
        }

        // Merge Countdowns
        foreach (var dto in payload.Countdowns)
        {
            var existing = await _db.Countdowns.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == dto.Id && c.UserId == userId);
            if (existing == null)
            {
                _db.Countdowns.Add(new Countdown
                {
                    Id = dto.Id, Title = dto.Title, TargetDate = dto.TargetDate, IsActive = dto.IsActive,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                });
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Title = dto.Title;
                existing.TargetDate = dto.TargetDate;
                existing.IsActive = dto.IsActive;
                existing.IsDeleted = dto.IsDeleted;
                existing.UpdatedAt = dto.UpdatedAt;
            }
        }

        // Merge Templates
        foreach (var dto in payload.Templates)
        {
            var existing = await _db.TaskTemplates.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == dto.Id && t.UserId == userId);
            if (existing == null)
            {
                _db.TaskTemplates.Add(new TaskTemplate
                {
                    Id = dto.Id, Name = dto.Name, Title = dto.Title, Description = dto.Description,
                    Priority = dto.Priority, DefaultTags = dto.DefaultTags,
                    UserId = userId, IsDeleted = dto.IsDeleted,
                    CreatedAt = dto.CreatedAt, UpdatedAt = dto.UpdatedAt,
                });
            }
            else if (IsNewer(dto.UpdatedAt, dto.CreatedAt, existing.UpdatedAt, existing.CreatedAt))
            {
                existing.Name = dto.Name;
                existing.Title = dto.Title;
                existing.Description = dto.Description;
                existing.Priority = dto.Priority;
                existing.DefaultTags = dto.DefaultTags;
                existing.IsDeleted = dto.IsDeleted;
                existing.UpdatedAt = dto.UpdatedAt;
            }
        }

        await _db.SaveChangesAsync();

        // Return current server state (so caller can update)
        return Ok(new SyncPayload { ServerTime = DateTime.UtcNow });
    }

    /// <summary>
    /// Returns true if incoming data is newer than existing data.
    /// </summary>
    private static bool IsNewer(DateTime? incomingUpdated, DateTime incomingCreated, DateTime? existingUpdated, DateTime existingCreated)
    {
        var incomingTime = incomingUpdated ?? incomingCreated;
        var existingTime = existingUpdated ?? existingCreated;
        return incomingTime > existingTime;
    }
}

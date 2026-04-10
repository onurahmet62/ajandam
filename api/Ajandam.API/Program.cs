using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ajandam.API.Hubs;
using Ajandam.Application.Mapping;
using Ajandam.Application.Services.Implementations;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Interfaces;
using Ajandam.Infrastructure.Data;
using Ajandam.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Database - support DATA_DIR env for persistent storage (Render, Docker)
var dataDir = Environment.GetEnvironmentVariable("DATA_DIR");
var connStr = string.IsNullOrEmpty(dataDir)
    ? builder.Configuration.GetConnectionString("DefaultConnection")!
    : $"Data Source={Path.Combine(dataDir, "ajandam.db")}";
builder.Services.AddDbContext<AjandamDbContext>(options => options.UseSqlite(connStr));

// Repositories
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<INoteService, NoteService>();
builder.Services.AddScoped<IJournalService, JournalService>();
builder.Services.AddScoped<ICountdownService, CountdownService>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IGroupInvitationService, GroupInvitationService>();
builder.Services.AddScoped<ITaskTemplateService, TaskTemplateService>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // Allow SignalR to use JWT from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? new[] { "http://localhost:5173", "http://localhost:3000" };
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// SignalR
builder.Services.AddSignalR();

// Sync services
builder.Services.AddSingleton<Ajandam.API.Services.SyncTokenStore>();
builder.Services.AddHttpClient("SyncClient");
if (!string.IsNullOrWhiteSpace(builder.Configuration["Sync:RemoteUrl"]))
{
    builder.Services.AddHostedService<Ajandam.API.Services.BackgroundSyncService>();
}

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Auto create/update database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AjandamDbContext>();
    db.Database.EnsureCreated();

    // Schema migrations: add missing columns/tables for existing DBs
    var alterStatements = new[]
    {
        "ALTER TABLE Users ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE TodoTasks ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE Tags ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE Notes ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE JournalEntries ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE Countdowns ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE Groups ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE GroupTasks ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE TaskTemplates ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;",
        "ALTER TABLE GroupTasks ADD COLUMN AssignedToAll INTEGER NOT NULL DEFAULT 1;",
    };
    foreach (var sql in alterStatements)
    {
        try { db.Database.ExecuteSqlRaw(sql); } catch { /* column already exists */ }
    }

    // New tables (safe: CREATE IF NOT EXISTS)
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS GroupInvitations (
            Id TEXT NOT NULL PRIMARY KEY,
            GroupId TEXT NOT NULL,
            Email TEXT NOT NULL,
            InvitedByUserId TEXT NOT NULL,
            Token TEXT NOT NULL,
            Status INTEGER NOT NULL DEFAULT 0,
            ExpiresAt TEXT NOT NULL,
            CreatedAt TEXT NOT NULL,
            UpdatedAt TEXT,
            IsDeleted INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (GroupId) REFERENCES Groups(Id) ON DELETE CASCADE,
            FOREIGN KEY (InvitedByUserId) REFERENCES Users(Id) ON DELETE RESTRICT
        );
    ");
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS GroupTaskAssignees (
            GroupTaskId TEXT NOT NULL,
            UserId TEXT NOT NULL,
            PRIMARY KEY (GroupTaskId, UserId),
            FOREIGN KEY (GroupTaskId) REFERENCES GroupTasks(Id) ON DELETE CASCADE,
            FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
        );
    ");
    db.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_GroupInvitations_Token ON GroupInvitations(Token);");
    db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_GroupInvitations_GroupId ON GroupInvitations(GroupId);");
    db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_GroupInvitations_InvitedByUserId ON GroupInvitations(InvitedByUserId);");
    db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_GroupTaskAssignees_UserId ON GroupTaskAssignees(UserId);");
    db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_GroupTasks_CreatedByUserId ON GroupTasks(CreatedByUserId);");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowClient");

// Serve React static files in production
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<GroupHub>("/hubs/group");

// SPA fallback: serve index.html for non-API, non-file routes
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();

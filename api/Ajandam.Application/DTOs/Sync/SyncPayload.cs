using Ajandam.Core.Enums;

namespace Ajandam.Application.DTOs.Sync;

public class SyncPullRequest
{
    public DateTime? Since { get; set; }
}

public class SyncPayload
{
    public List<SyncTaskDto> Tasks { get; set; } = new();
    public List<SyncTagDto> Tags { get; set; } = new();
    public List<SyncNoteDto> Notes { get; set; } = new();
    public List<SyncJournalDto> JournalEntries { get; set; } = new();
    public List<SyncCountdownDto> Countdowns { get; set; } = new();
    public List<SyncTemplateDto> Templates { get; set; } = new();
    public DateTime ServerTime { get; set; }
}

public class SyncTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public TodoStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public RecurrenceType RecurrenceType { get; set; }
    public int RecurrenceInterval { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public Guid? ParentTaskId { get; set; }
    public List<Guid> TagIds { get; set; } = new();
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SyncTagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Color { get; set; } = "#A7C7E7";
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SyncNoteDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime Date { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SyncJournalDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = "";
    public DateTime Date { get; set; }
    public string? Mood { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SyncCountdownDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public DateTime TargetDate { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SyncTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public string? DefaultTags { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

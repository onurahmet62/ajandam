using Ajandam.Core.Enums;

namespace Ajandam.Core.Entities;

public class TodoTask : BaseEntity
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public TodoStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public RecurrenceType RecurrenceType { get; set; }
    public int RecurrenceInterval { get; set; } = 1;
    public DateTime? RecurrenceEndDate { get; set; }
    public Guid? ParentTaskId { get; set; }

    public List<TodoTaskTag> TodoTaskTags { get; set; } = new();
}

using Ajandam.Core.Enums;

namespace Ajandam.Core.Entities;

public class GroupTask : BaseEntity
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public TodoStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public Guid GroupId { get; set; }
    public Group Group { get; set; } = default!;

    public Guid? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }

    public Guid CreatedByUserId { get; set; }
}

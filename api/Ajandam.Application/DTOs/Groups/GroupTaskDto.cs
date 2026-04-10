using Ajandam.Core.Enums;

namespace Ajandam.Application.DTOs.Groups;

public class GroupTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public TodoStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool AssignedToAll { get; set; }
    public List<AssigneeDto> Assignees { get; set; } = new();
    public Guid GroupId { get; set; }
    public string? GroupName { get; set; }
}

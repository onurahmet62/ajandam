using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Tasks;

public class TodoTaskDto
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
    public List<TagDto> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class TagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Color { get; set; } = "";
}

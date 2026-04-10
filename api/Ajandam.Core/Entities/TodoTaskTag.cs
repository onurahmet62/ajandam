namespace Ajandam.Core.Entities;

public class TodoTaskTag
{
    public Guid TodoTaskId { get; set; }
    public TodoTask TodoTask { get; set; } = default!;

    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = default!;
}

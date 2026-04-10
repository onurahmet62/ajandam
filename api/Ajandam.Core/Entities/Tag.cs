namespace Ajandam.Core.Entities;

public class Tag : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Color { get; set; } = "#A7C7E7";

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public List<TodoTaskTag> TodoTaskTags { get; set; } = new();
}

using Ajandam.Core.Enums;

namespace Ajandam.Core.Entities;

public class TaskTemplate : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public string? DefaultTags { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}

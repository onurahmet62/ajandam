namespace Ajandam.Core.Entities;

public class Group : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public List<UserGroup> UserGroups { get; set; } = new();
    public List<GroupTask> GroupTasks { get; set; } = new();
}

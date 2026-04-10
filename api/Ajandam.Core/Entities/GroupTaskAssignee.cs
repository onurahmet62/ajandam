namespace Ajandam.Core.Entities;

public class GroupTaskAssignee
{
    public Guid GroupTaskId { get; set; }
    public GroupTask GroupTask { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}

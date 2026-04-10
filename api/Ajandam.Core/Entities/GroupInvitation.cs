using Ajandam.Core.Enums;

namespace Ajandam.Core.Entities;

public class GroupInvitation : BaseEntity
{
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = default!;

    public string Email { get; set; } = default!;

    public Guid InvitedByUserId { get; set; }
    public User InvitedByUser { get; set; } = default!;

    public string Token { get; set; } = Guid.NewGuid().ToString();

    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public DateTime ExpiresAt { get; set; }
}

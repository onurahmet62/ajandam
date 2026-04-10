using Ajandam.Application.DTOs.Groups;

namespace Ajandam.Application.Services.Interfaces;

public interface IGroupInvitationService
{
    Task<InviteResultDto> InviteByEmailAsync(Guid adminUserId, Guid groupId, string email);
    Task<IEnumerable<GroupInvitationDto>> GetPendingInvitationsForUserAsync(Guid userId);
    Task<IEnumerable<GroupInvitationDto>> GetGroupInvitationsAsync(Guid adminUserId, Guid groupId);
    Task<bool> AcceptInvitationAsync(Guid invitationId, Guid userId);
    Task<bool> RejectInvitationAsync(Guid invitationId, Guid userId);
    Task ProcessPendingOnRegisterAsync(string email, Guid userId);
}

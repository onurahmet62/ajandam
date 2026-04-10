using Microsoft.EntityFrameworkCore;
using Ajandam.Application.DTOs.Groups;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Enums;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class GroupInvitationService : IGroupInvitationService
{
    private readonly IUnitOfWork _uow;

    public GroupInvitationService(IUnitOfWork uow) { _uow = uow; }

    public async Task<InviteResultDto> InviteByEmailAsync(Guid adminUserId, Guid groupId, string email)
    {
        email = email.Trim().ToLowerInvariant();

        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null)
            throw new KeyNotFoundException("Grup bulunamadi.");
        if (!group.UserGroups.Any(ug => ug.UserId == adminUserId && ug.Role == GroupRole.Admin))
            throw new UnauthorizedAccessException("Bu islemi sadece yoneticiler yapabilir.");

        // Check if user exists
        var existingUser = (await _uow.Users.FindAsync(u => u.Email == email)).FirstOrDefault();

        if (existingUser != null)
        {
            // Already a member?
            if (group.UserGroups.Any(ug => ug.UserId == existingUser.Id))
                return new InviteResultDto(false, null, "Bu kullanici zaten grubun uyesi.");

            // Registered but not a member → add directly
            group.UserGroups.Add(new UserGroup { UserId = existingUser.Id, GroupId = groupId, Role = GroupRole.Member });
            await _uow.SaveChangesAsync();
            return new InviteResultDto(true, null, $"{existingUser.FullName} gruba eklendi.");
        }

        // Not registered → check if already invited
        var existingInvitation = await _uow.GroupInvitations.Query
            .FirstOrDefaultAsync(i => i.GroupId == groupId && i.Email == email && i.Status == InvitationStatus.Pending);
        if (existingInvitation != null)
            return new InviteResultDto(false, $"/groups/invite/{existingInvitation.Token}", "Bu email icin zaten bekleyen bir davet var.");

        // Create invitation
        var invitation = new GroupInvitation
        {
            GroupId = groupId,
            Email = email,
            InvitedByUserId = adminUserId,
            Token = Guid.NewGuid().ToString(),
            Status = InvitationStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        await _uow.GroupInvitations.AddAsync(invitation);
        await _uow.SaveChangesAsync();

        return new InviteResultDto(false, $"/groups/invite/{invitation.Token}", "Davet linki olusturuldu. Linki kopyalayip paylasabilirsiniz.");
    }

    public async Task<IEnumerable<GroupInvitationDto>> GetPendingInvitationsForUserAsync(Guid userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return Enumerable.Empty<GroupInvitationDto>();

        var invitations = await _uow.GroupInvitations.Query
            .Include(i => i.Group)
            .Include(i => i.InvitedByUser)
            .Where(i => i.Email == user.Email && i.Status == InvitationStatus.Pending && i.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return invitations.Select(i => new GroupInvitationDto(
            i.Id, i.GroupId, i.Group.Name, i.Email, i.InvitedByUser.FullName, i.Status, i.CreatedAt
        ));
    }

    public async Task<IEnumerable<GroupInvitationDto>> GetGroupInvitationsAsync(Guid adminUserId, Guid groupId)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return Enumerable.Empty<GroupInvitationDto>();
        if (!group.UserGroups.Any(ug => ug.UserId == adminUserId && ug.Role == GroupRole.Admin))
            return Enumerable.Empty<GroupInvitationDto>();

        var invitations = await _uow.GroupInvitations.Query
            .Include(i => i.Group)
            .Include(i => i.InvitedByUser)
            .Where(i => i.GroupId == groupId && i.Status == InvitationStatus.Pending)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return invitations.Select(i => new GroupInvitationDto(
            i.Id, i.GroupId, i.Group.Name, i.Email, i.InvitedByUser.FullName, i.Status, i.CreatedAt
        ));
    }

    public async Task<bool> AcceptInvitationAsync(Guid invitationId, Guid userId)
    {
        var invitation = await _uow.GroupInvitations.Query
            .Include(i => i.Group).ThenInclude(g => g.UserGroups)
            .FirstOrDefaultAsync(i => i.Id == invitationId);
        if (invitation == null) return false;

        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null || user.Email != invitation.Email) return false;

        if (invitation.Status != InvitationStatus.Pending || invitation.ExpiresAt <= DateTime.UtcNow)
            return false;

        // Already a member?
        if (invitation.Group.UserGroups.Any(ug => ug.UserId == userId))
        {
            invitation.Status = InvitationStatus.Accepted;
            _uow.GroupInvitations.Update(invitation);
            await _uow.SaveChangesAsync();
            return true;
        }

        invitation.Status = InvitationStatus.Accepted;
        _uow.GroupInvitations.Update(invitation);
        invitation.Group.UserGroups.Add(new UserGroup { UserId = userId, GroupId = invitation.GroupId, Role = GroupRole.Member });
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectInvitationAsync(Guid invitationId, Guid userId)
    {
        var invitation = await _uow.GroupInvitations.GetByIdAsync(invitationId);
        if (invitation == null) return false;

        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null || user.Email != invitation.Email) return false;

        if (invitation.Status != InvitationStatus.Pending) return false;

        invitation.Status = InvitationStatus.Rejected;
        _uow.GroupInvitations.Update(invitation);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task ProcessPendingOnRegisterAsync(string email, Guid userId)
    {
        // No-op: invitations stay as Pending, user will see them as notifications on login
        // This method exists as a hook point if we want to auto-accept or notify in the future
    }
}

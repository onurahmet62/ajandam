using Ajandam.Application.DTOs.Groups;
using Ajandam.Core.Enums;

namespace Ajandam.Application.Services.Interfaces;

public interface IGroupService
{
    Task<GroupDto> CreateAsync(Guid userId, CreateGroupDto dto);
    Task<IEnumerable<GroupDto>> GetUserGroupsAsync(Guid userId);
    Task<GroupDto?> GetByIdAsync(Guid userId, Guid groupId);
    Task<bool> AddMemberAsync(Guid adminUserId, Guid groupId, Guid memberUserId, GroupRole role = GroupRole.Member);
    Task<bool> RemoveMemberAsync(Guid adminUserId, Guid groupId, Guid memberUserId);
    Task<GroupTaskDto> CreateTaskAsync(Guid userId, Guid groupId, CreateGroupTaskDto dto);
    Task<IEnumerable<GroupTaskDto>> GetGroupTasksAsync(Guid userId, Guid groupId);
    Task<bool> DeleteAsync(Guid userId, Guid groupId);
    Task<bool> UpdateMemberRoleAsync(Guid adminUserId, Guid groupId, Guid memberId, GroupRole newRole);
    Task<GroupTaskDto?> UpdateTaskAsync(Guid userId, Guid groupId, Guid taskId, UpdateGroupTaskDto dto);
    Task<bool> DeleteTaskAsync(Guid userId, Guid groupId, Guid taskId);
    Task<bool> LeaveGroupAsync(Guid userId, Guid groupId);
    Task<IEnumerable<GroupTaskDto>> GetMyGroupTasksAsync(Guid userId, DateTime? start, DateTime? end);
}

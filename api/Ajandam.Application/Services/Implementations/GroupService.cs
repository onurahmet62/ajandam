using Microsoft.EntityFrameworkCore;
using Ajandam.Application.DTOs.Groups;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Enums;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class GroupService : IGroupService
{
    private readonly IUnitOfWork _uow;

    public GroupService(IUnitOfWork uow) { _uow = uow; }

    public async Task<GroupDto> CreateAsync(Guid userId, CreateGroupDto dto)
    {
        var group = new Group { Name = dto.Name, Description = dto.Description };
        await _uow.Groups.AddAsync(group);
        await _uow.SaveChangesAsync();

        group.UserGroups.Add(new UserGroup { UserId = userId, GroupId = group.Id, Role = GroupRole.Admin });
        await _uow.SaveChangesAsync();

        return await GetByIdAsync(userId, group.Id) ?? throw new Exception("Group creation failed");
    }

    public async Task<IEnumerable<GroupDto>> GetUserGroupsAsync(Guid userId)
    {
        var groups = await _uow.Groups.Query
            .Include(g => g.UserGroups).ThenInclude(ug => ug.User)
            .Where(g => g.UserGroups.Any(ug => ug.UserId == userId))
            .ToListAsync();
        return groups.Select(MapGroupDto);
    }

    public async Task<GroupDto?> GetByIdAsync(Guid userId, Guid groupId)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups).ThenInclude(ug => ug.User)
            .FirstOrDefaultAsync(g => g.Id == groupId && g.UserGroups.Any(ug => ug.UserId == userId));
        return group == null ? null : MapGroupDto(group);
    }

    public async Task<bool> AddMemberAsync(Guid adminUserId, Guid groupId, Guid memberUserId, GroupRole role = GroupRole.Member)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return false;
        if (!group.UserGroups.Any(ug => ug.UserId == adminUserId && ug.Role == GroupRole.Admin)) return false;
        if (group.UserGroups.Any(ug => ug.UserId == memberUserId)) return false;

        group.UserGroups.Add(new UserGroup { UserId = memberUserId, GroupId = groupId, Role = role });
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveMemberAsync(Guid adminUserId, Guid groupId, Guid memberUserId)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return false;
        if (!group.UserGroups.Any(ug => ug.UserId == adminUserId && ug.Role == GroupRole.Admin)) return false;

        var member = group.UserGroups.FirstOrDefault(ug => ug.UserId == memberUserId);
        if (member == null) return false;
        group.UserGroups.Remove(member);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<GroupTaskDto> CreateTaskAsync(Guid userId, Guid groupId, CreateGroupTaskDto dto)
    {
        var isMember = await _uow.Groups.Query
            .AnyAsync(g => g.Id == groupId && g.UserGroups.Any(ug => ug.UserId == userId));
        if (!isMember) throw new UnauthorizedAccessException("Bu grubun uyesi degilsiniz.");

        var task = new GroupTask
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Status = TodoStatus.Planlandi,
            DueDate = dto.DueDate,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            GroupId = groupId,
            CreatedByUserId = userId,
            AssignedToAll = dto.AssignedToAll
        };
        await _uow.GroupTasks.AddAsync(task);
        await _uow.SaveChangesAsync();

        // Create assignees if not assigned to all
        if (!dto.AssignedToAll && dto.AssigneeUserIds?.Any() == true)
        {
            foreach (var uid in dto.AssigneeUserIds)
            {
                task.Assignees.Add(new GroupTaskAssignee { GroupTaskId = task.Id, UserId = uid });
            }
            await _uow.SaveChangesAsync();
        }

        return await GetTaskDtoById(task.Id);
    }

    public async Task<IEnumerable<GroupTaskDto>> GetGroupTasksAsync(Guid userId, Guid groupId)
    {
        var isMember = await _uow.Groups.Query
            .AnyAsync(g => g.Id == groupId && g.UserGroups.Any(ug => ug.UserId == userId));
        if (!isMember) return Enumerable.Empty<GroupTaskDto>();

        var tasks = await _uow.GroupTasks.Query
            .Include(t => t.AssignedToUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Group)
            .Include(t => t.Assignees).ThenInclude(a => a.User)
            .Where(t => t.GroupId == groupId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return tasks.Select(MapTaskDto);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid groupId)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return false;
        if (!group.UserGroups.Any(ug => ug.UserId == userId && ug.Role == GroupRole.Admin)) return false;
        _uow.Groups.Delete(group);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateMemberRoleAsync(Guid adminUserId, Guid groupId, Guid memberId, GroupRole newRole)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return false;
        if (!group.UserGroups.Any(ug => ug.UserId == adminUserId && ug.Role == GroupRole.Admin)) return false;

        var member = group.UserGroups.FirstOrDefault(ug => ug.UserId == memberId);
        if (member == null) return false;

        member.Role = newRole;
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<GroupTaskDto?> UpdateTaskAsync(Guid userId, Guid groupId, Guid taskId, UpdateGroupTaskDto dto)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return null;

        var isAdmin = group.UserGroups.Any(ug => ug.UserId == userId && ug.Role == GroupRole.Admin);
        var task = await _uow.GroupTasks.Query
            .Include(t => t.Assignees)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.GroupId == groupId);
        if (task == null) return null;

        // Only admin or task creator can edit
        if (!isAdmin && task.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("Bu gorevi duzenleme yetkiniz yok.");

        if (dto.Title != null) task.Title = dto.Title;
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;
        if (dto.Status.HasValue) task.Status = dto.Status.Value;
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value;
        if (dto.StartDate.HasValue) task.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) task.EndDate = dto.EndDate.Value;

        if (dto.AssignedToAll.HasValue)
        {
            task.AssignedToAll = dto.AssignedToAll.Value;
        }

        if (dto.AssigneeUserIds != null)
        {
            task.Assignees.Clear();
            foreach (var uid in dto.AssigneeUserIds)
            {
                task.Assignees.Add(new GroupTaskAssignee { GroupTaskId = task.Id, UserId = uid });
            }
        }

        _uow.GroupTasks.Update(task);
        await _uow.SaveChangesAsync();

        return await GetTaskDtoById(task.Id);
    }

    public async Task<bool> DeleteTaskAsync(Guid userId, Guid groupId, Guid taskId)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return false;

        var isAdmin = group.UserGroups.Any(ug => ug.UserId == userId && ug.Role == GroupRole.Admin);
        var task = await _uow.GroupTasks.Query
            .FirstOrDefaultAsync(t => t.Id == taskId && t.GroupId == groupId);
        if (task == null) return false;

        if (!isAdmin && task.CreatedByUserId != userId) return false;

        _uow.GroupTasks.Delete(task);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> LeaveGroupAsync(Guid userId, Guid groupId)
    {
        var group = await _uow.Groups.Query
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == groupId);
        if (group == null) return false;

        var member = group.UserGroups.FirstOrDefault(ug => ug.UserId == userId);
        if (member == null) return false;

        // Last admin can't leave
        if (member.Role == GroupRole.Admin)
        {
            var adminCount = group.UserGroups.Count(ug => ug.Role == GroupRole.Admin);
            if (adminCount <= 1)
                throw new InvalidOperationException("Gruptaki son yonetici ayrilamaz. Once baskasini yonetici yapin.");
        }

        group.UserGroups.Remove(member);

        // Remove user's task assignments in this group
        var tasksWithAssignments = await _uow.GroupTasks.Query
            .Include(t => t.Assignees)
            .Where(t => t.GroupId == groupId && t.Assignees.Any(a => a.UserId == userId))
            .ToListAsync();
        foreach (var task in tasksWithAssignments)
        {
            var assignment = task.Assignees.FirstOrDefault(a => a.UserId == userId);
            if (assignment != null) task.Assignees.Remove(assignment);
        }

        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<GroupTaskDto>> GetMyGroupTasksAsync(Guid userId, DateTime? start, DateTime? end)
    {
        // Get all groups the user is a member of
        var userGroupIds = await _uow.Groups.Query
            .Where(g => g.UserGroups.Any(ug => ug.UserId == userId))
            .Select(g => g.Id)
            .ToListAsync();

        if (!userGroupIds.Any()) return Enumerable.Empty<GroupTaskDto>();

        var query = _uow.GroupTasks.Query
            .Include(t => t.Group)
            .Include(t => t.AssignedToUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Assignees).ThenInclude(a => a.User)
            .Where(t => userGroupIds.Contains(t.GroupId))
            .Where(t => t.AssignedToAll || t.Assignees.Any(a => a.UserId == userId));

        if (start.HasValue)
        {
            query = query.Where(t =>
                (t.DueDate != null && t.DueDate >= start.Value) ||
                (t.StartDate != null && t.StartDate >= start.Value) ||
                (t.EndDate != null && t.EndDate >= start.Value));
        }
        if (end.HasValue)
        {
            query = query.Where(t =>
                (t.DueDate != null && t.DueDate <= end.Value) ||
                (t.StartDate != null && t.StartDate <= end.Value) ||
                (t.EndDate != null && t.EndDate <= end.Value));
        }

        var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return tasks.Select(MapTaskDto);
    }

    private async Task<GroupTaskDto> GetTaskDtoById(Guid taskId)
    {
        var task = await _uow.GroupTasks.Query
            .Include(t => t.AssignedToUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Group)
            .Include(t => t.Assignees).ThenInclude(a => a.User)
            .FirstAsync(t => t.Id == taskId);
        return MapTaskDto(task);
    }

    private static GroupTaskDto MapTaskDto(GroupTask t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        Priority = t.Priority,
        Status = t.Status,
        DueDate = t.DueDate,
        StartDate = t.StartDate,
        EndDate = t.EndDate,
        AssignedToUserId = t.AssignedToUserId,
        AssignedToUserName = t.AssignedToUser?.FullName,
        CreatedByUserId = t.CreatedByUserId,
        CreatedByUserName = t.CreatedByUser?.FullName,
        CreatedAt = t.CreatedAt,
        AssignedToAll = t.AssignedToAll,
        GroupId = t.GroupId,
        GroupName = t.Group?.Name,
        Assignees = t.Assignees?.Select(a => new AssigneeDto(a.UserId, a.User?.FullName ?? "")).ToList() ?? new()
    };

    private static GroupDto MapGroupDto(Group g) => new(
        g.Id, g.Name, g.Description,
        g.UserGroups.Select(ug => new GroupMemberDto(ug.UserId, ug.User.FullName, ug.User.Email, ug.Role)).ToList(),
        g.CreatedAt);
}

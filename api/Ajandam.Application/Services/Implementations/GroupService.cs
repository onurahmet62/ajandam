using AutoMapper;
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
    private readonly IMapper _mapper;

    public GroupService(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }

    public async Task<GroupDto> CreateAsync(Guid userId, CreateGroupDto dto)
    {
        var group = new Group { Name = dto.Name, Description = dto.Description };
        await _uow.Groups.AddAsync(group);
        await _uow.SaveChangesAsync();

        // Creator is admin
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
            AssignedToUserId = dto.AssignedToUserId,
            CreatedByUserId = userId
        };
        await _uow.GroupTasks.AddAsync(task);
        await _uow.SaveChangesAsync();

        var saved = await _uow.GroupTasks.Query
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == task.Id);
        return _mapper.Map<GroupTaskDto>(saved!);
    }

    public async Task<IEnumerable<GroupTaskDto>> GetGroupTasksAsync(Guid userId, Guid groupId)
    {
        var isMember = await _uow.Groups.Query
            .AnyAsync(g => g.Id == groupId && g.UserGroups.Any(ug => ug.UserId == userId));
        if (!isMember) return Enumerable.Empty<GroupTaskDto>();

        var tasks = await _uow.GroupTasks.Query
            .Include(t => t.AssignedToUser)
            .Where(t => t.GroupId == groupId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return _mapper.Map<IEnumerable<GroupTaskDto>>(tasks);
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

    private static GroupDto MapGroupDto(Group g) => new(
        g.Id, g.Name, g.Description,
        g.UserGroups.Select(ug => new GroupMemberDto(ug.UserId, ug.User.FullName, ug.User.Email, ug.Role)).ToList(),
        g.CreatedAt);
}

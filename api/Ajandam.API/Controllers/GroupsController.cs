using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Ajandam.API.Hubs;
using Ajandam.Application.DTOs.Groups;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Enums;

namespace Ajandam.API.Controllers;

[Route("api/groups")]
[Authorize]
public class GroupsController : BaseController
{
    private readonly IGroupService _groupService;
    private readonly IHubContext<GroupHub> _hubContext;

    public GroupsController(IGroupService groupService, IHubContext<GroupHub> hubContext)
    {
        _groupService = groupService;
        _hubContext = hubContext;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateGroupDto dto)
        => Ok(await _groupService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _groupService.GetUserGroupsAsync(GetUserId()));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var group = await _groupService.GetByIdAsync(GetUserId(), id);
        return group == null ? NotFound() : Ok(group);
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        var result = await _groupService.AddMemberAsync(GetUserId(), id, request.UserId, request.Role);
        if (result) await _hubContext.Clients.Group(id.ToString()).SendAsync("GroupUpdated", "member_added");
        return result ? Ok() : BadRequest();
    }

    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId)
    {
        var result = await _groupService.RemoveMemberAsync(GetUserId(), id, memberId);
        if (result) await _hubContext.Clients.Group(id.ToString()).SendAsync("GroupUpdated", "member_removed");
        return result ? Ok() : BadRequest();
    }

    [HttpPost("{id}/tasks")]
    public async Task<IActionResult> CreateTask(Guid id, CreateGroupTaskDto dto)
    {
        var task = await _groupService.CreateTaskAsync(GetUserId(), id, dto);
        await _hubContext.Clients.Group(id.ToString()).SendAsync("GroupUpdated", "task_created");
        return Ok(task);
    }

    [HttpGet("{id}/tasks")]
    public async Task<IActionResult> GetTasks(Guid id)
        => Ok(await _groupService.GetGroupTasksAsync(GetUserId(), id));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _groupService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();
}

public record AddMemberRequest(Guid UserId, GroupRole Role = GroupRole.Member);

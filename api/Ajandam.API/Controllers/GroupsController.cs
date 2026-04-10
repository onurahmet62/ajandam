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
    private readonly IGroupInvitationService _invitationService;
    private readonly IHubContext<GroupHub> _hubContext;

    public GroupsController(IGroupService groupService, IGroupInvitationService invitationService, IHubContext<GroupHub> hubContext)
    {
        _groupService = groupService;
        _invitationService = invitationService;
        _hubContext = hubContext;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateGroupDto dto)
        => Ok(await _groupService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _groupService.GetUserGroupsAsync(GetUserId()));

    // Static routes BEFORE parameterized routes
    [HttpGet("my-invitations")]
    public async Task<IActionResult> GetMyInvitations()
        => Ok(await _invitationService.GetPendingInvitationsForUserAsync(GetUserId()));

    [HttpGet("my-tasks")]
    public async Task<IActionResult> GetMyGroupTasks([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        => Ok(await _groupService.GetMyGroupTasksAsync(GetUserId(), start, end));

    [HttpPost("invitations/{invitationId}/accept")]
    public async Task<IActionResult> AcceptInvitation(Guid invitationId)
    {
        var result = await _invitationService.AcceptInvitationAsync(invitationId, GetUserId());
        return result ? Ok(new { message = "Davet kabul edildi." }) : BadRequest(new { message = "Davet kabul edilemedi." });
    }

    [HttpPost("invitations/{invitationId}/reject")]
    public async Task<IActionResult> RejectInvitation(Guid invitationId)
    {
        var result = await _invitationService.RejectInvitationAsync(invitationId, GetUserId());
        return result ? Ok(new { message = "Davet reddedildi." }) : BadRequest(new { message = "Davet reddedilemedi." });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var group = await _groupService.GetByIdAsync(GetUserId(), id);
        return group == null ? NotFound() : Ok(group);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _groupService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();

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

    [HttpPut("{id}/members/{memberId}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid memberId, [FromBody] UpdateRoleRequest request)
    {
        var result = await _groupService.UpdateMemberRoleAsync(GetUserId(), id, memberId, request.Role);
        if (result) await _hubContext.Clients.Group(id.ToString()).SendAsync("GroupUpdated", "role_updated");
        return result ? Ok() : BadRequest();
    }

    [HttpPost("{id}/invite")]
    public async Task<IActionResult> InviteByEmail(Guid id, [FromBody] InviteByEmailDto dto)
    {
        try
        {
            var result = await _invitationService.InviteByEmailAsync(GetUserId(), id, dto.Email);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/invitations")]
    public async Task<IActionResult> GetGroupInvitations(Guid id)
        => Ok(await _invitationService.GetGroupInvitationsAsync(GetUserId(), id));

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

    [HttpPut("{id}/tasks/{taskId}")]
    public async Task<IActionResult> UpdateTask(Guid id, Guid taskId, [FromBody] UpdateGroupTaskDto dto)
    {
        try
        {
            var result = await _groupService.UpdateTaskAsync(GetUserId(), id, taskId, dto);
            if (result == null) return NotFound();
            await _hubContext.Clients.Group(id.ToString()).SendAsync("GroupUpdated", "task_updated");
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}/tasks/{taskId}")]
    public async Task<IActionResult> DeleteTask(Guid id, Guid taskId)
    {
        var result = await _groupService.DeleteTaskAsync(GetUserId(), id, taskId);
        if (result) await _hubContext.Clients.Group(id.ToString()).SendAsync("GroupUpdated", "task_deleted");
        return result ? NoContent() : NotFound();
    }

    [HttpPost("{id}/leave")]
    public async Task<IActionResult> LeaveGroup(Guid id)
    {
        try
        {
            var result = await _groupService.LeaveGroupAsync(GetUserId(), id);
            return result ? Ok(new { message = "Gruptan ayrildiniz." }) : BadRequest();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record AddMemberRequest(Guid UserId, GroupRole Role = GroupRole.Member);
public record UpdateRoleRequest(GroupRole Role);

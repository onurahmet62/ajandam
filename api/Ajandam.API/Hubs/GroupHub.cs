using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Ajandam.API.Hubs;

[Authorize]
public class GroupHub : Hub
{
    public async Task JoinGroup(string groupId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
    }

    public async Task LeaveGroup(string groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
    }

    public async Task NotifyGroupUpdate(string groupId, string message)
    {
        await Clients.Group(groupId).SendAsync("GroupUpdated", message);
    }
}

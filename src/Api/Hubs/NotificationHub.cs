using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
    public async Task MarkAsRead(string notificationId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            await Clients.Caller.SendAsync("error", "User not authenticated");
            return;
        }

        var payload = new
        {
            notificationId,
            userId,
            readAt = DateTime.UtcNow
        };

        await Clients.User(userId).SendAsync("notification.marked_as_read", payload);
    }

    public async Task MarkAllAsRead()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            await Clients.Caller.SendAsync("error", "User not authenticated");
            return;
        }

        var payload = new
        {
            userId,
            readAt = DateTime.UtcNow
        };

        await Clients.User(userId).SendAsync("notifications.all_marked_as_read", payload);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            await Clients.User(userId).SendAsync("notification.connected", new { connectedAt = DateTime.UtcNow });
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}

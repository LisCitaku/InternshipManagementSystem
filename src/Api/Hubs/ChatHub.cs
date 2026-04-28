using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    public async Task SendMessage(string recipientId, string message)
    {
        var senderId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(recipientId, out var recipientGuid) || senderId is null || !Guid.TryParse(senderId, out var senderGuid))
        {
            await Clients.Caller.SendAsync("error", "Invalid chat participant.");
            return;
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            await Clients.Caller.SendAsync("error", "Message cannot be empty");
            return;
        }

        var payload = new
        {
            id = Guid.NewGuid(),
            conversationId = Guid.Empty,
            senderUserId = senderGuid,
            recipientUserId = recipientGuid,
            body = message.Trim(),
            createdAt = DateTime.UtcNow,
            readAt = (DateTime?)null
        };

        await Clients.User(recipientId).SendAsync("message.received", payload);
        await Clients.Caller.SendAsync("message.sent", payload);
    }

    public async Task MarkAsRead(string conversationId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            await Clients.Caller.SendAsync("error", "User not authenticated");
            return;
        }

        var payload = new
        {
            conversationId,
            userId = Guid.Parse(userId),
            readAt = DateTime.UtcNow
        };

        await Clients.Caller.SendAsync("message.marked_as_read", payload);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
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

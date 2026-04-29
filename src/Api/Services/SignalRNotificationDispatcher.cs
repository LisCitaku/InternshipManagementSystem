using Api.Hubs;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Api.Services;

public sealed class SignalRNotificationDispatcher(IHubContext<NotificationHub> notificationHub, IHubContext<ChatHub> chatHub)
    : INotificationDispatcher
{
    public Task DispatchAsync(NotificationDto notification, CancellationToken cancellationToken = default) =>
        notificationHub.Clients.User(notification.UserId.ToString()).SendAsync("notification.received", notification, cancellationToken);

    public Task DispatchMessageAsync(MessageDto message, CancellationToken cancellationToken = default) =>
        chatHub.Clients.Users(message.SenderUserId.ToString(), message.RecipientUserId.ToString()).SendAsync("message.received", message, cancellationToken);

    public Task DispatchDashboardRefreshAsync(string? scope = null, CancellationToken cancellationToken = default) =>
        notificationHub.Clients.All.SendAsync("dashboard.updated", new { scope, updatedAt = DateTime.UtcNow }, cancellationToken);

    public async Task DispatchChatRefreshAsync(Guid senderUserId, Guid recipientUserId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        var payload = new { conversationId, senderUserId, recipientUserId, updatedAt = DateTime.UtcNow };
        await chatHub.Clients.Users(senderUserId.ToString(), recipientUserId.ToString()).SendAsync("chat.updated", payload, cancellationToken);
        await chatHub.Clients.Users(senderUserId.ToString(), recipientUserId.ToString()).SendAsync("conversation.updated", payload, cancellationToken);
    }

    public Task DispatchApplicationAlertAsync(IEnumerable<Guid> userIds, object payload, CancellationToken cancellationToken = default) =>
        notificationHub.Clients.Users(userIds.Select(x => x.ToString())).SendAsync("application.submitted", payload, cancellationToken);

    public Task DispatchInternshipPublishedAsync(IEnumerable<Guid> userIds, object payload, CancellationToken cancellationToken = default) =>
        notificationHub.Clients.Users(userIds.Select(x => x.ToString())).SendAsync("internship.published", payload, cancellationToken);

    public Task DispatchRecruiterRequestAsync(IEnumerable<Guid> adminUserIds, object payload, CancellationToken cancellationToken = default) =>
        notificationHub.Clients.Users(adminUserIds.Select(x => x.ToString())).SendAsync("recruiter.request.submitted", payload, cancellationToken);
}

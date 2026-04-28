using Application.Common;
using Application.DTOs;
using Application.Features.Chat.Commands;
using Application.Features.Chat.Queries;
using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.Chat.Handlers;

public sealed class SendMessageCommandHandler(
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUser,
    INotificationDispatcher notifications)
    : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    public async Task<Result<MessageDto>> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<MessageDto>.Failure("Authentication is required.");

        var message = new Message
        {
            ConversationId = request.Request.ConversationId,
            SenderUserId = currentUser.UserId.Value,
            RecipientUserId = request.Request.RecipientUserId,
            Body = request.Request.Body.Trim(),
            CreatedBy = currentUser.UserId
        };

        await unitOfWork.Repository<Message>().AddAsync(message, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new MessageDto(message.Id, message.ConversationId, message.SenderUserId, message.RecipientUserId, message.Body, message.CreatedAt, message.ReadAt);
        await notifications.DispatchMessageAsync(dto, cancellationToken);
        await notifications.DispatchChatRefreshAsync(message.SenderUserId, message.RecipientUserId, message.ConversationId, cancellationToken);
        return Result<MessageDto>.Success(dto);
    }
}

public sealed class CreateConversationCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, INotificationDispatcher notifications)
    : IRequestHandler<CreateConversationCommand, Result<ConversationSummaryDto>>
{
    public async Task<Result<ConversationSummaryDto>> Handle(CreateConversationCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<ConversationSummaryDto>.Failure("Authentication is required.");

        if (currentUser.UserId.Value == request.Request.RecipientUserId)
            return Result<ConversationSummaryDto>.Failure("You cannot start a conversation with yourself.");

        var currentUserId = currentUser.UserId.Value;
        var existingConversationId = unitOfWork.Repository<Message>().Query()
            .Where(message =>
                (message.SenderUserId == currentUserId && message.RecipientUserId == request.Request.RecipientUserId) ||
                (message.SenderUserId == request.Request.RecipientUserId && message.RecipientUserId == currentUserId))
            .OrderByDescending(message => message.CreatedAt)
            .Select(message => message.ConversationId)
            .FirstOrDefault();

        if (existingConversationId != Guid.Empty)
            return Result<ConversationSummaryDto>.Success(await ChatSummaryBuilder.BuildConversationSummaryAsync(unitOfWork, currentUserId, existingConversationId, cancellationToken));

        var conversation = new Conversation
        {
            Subject = string.IsNullOrWhiteSpace(request.Request.Subject) ? "Direct chat" : request.Request.Subject.Trim(),
            CreatedBy = currentUserId
        };

        await unitOfWork.Repository<Conversation>().AddAsync(conversation, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var summary = await ChatSummaryBuilder.BuildConversationSummaryAsync(unitOfWork, currentUserId, conversation.Id, cancellationToken, request.Request.RecipientUserId);
        await notifications.DispatchChatRefreshAsync(currentUserId, request.Request.RecipientUserId, conversation.Id, cancellationToken);
        return Result<ConversationSummaryDto>.Success(summary);
    }
}

public sealed class GetChatConversationsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetChatConversationsQuery, Result<IReadOnlyList<ConversationSummaryDto>>>
{
    public async Task<Result<IReadOnlyList<ConversationSummaryDto>>> Handle(GetChatConversationsQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<IReadOnlyList<ConversationSummaryDto>>.Failure("Authentication is required.");

        var currentUserId = currentUser.UserId.Value;
        var conversationIds = unitOfWork.Repository<Message>().Query()
            .Where(message => message.SenderUserId == currentUserId || message.RecipientUserId == currentUserId)
            .Select(message => message.ConversationId)
            .Distinct()
            .ToList();

        var summaries = new List<ConversationSummaryDto>();
        foreach (var conversationId in conversationIds)
        {
            summaries.Add(await ChatSummaryBuilder.BuildConversationSummaryAsync(unitOfWork, currentUserId, conversationId, cancellationToken));
        }

        return Result<IReadOnlyList<ConversationSummaryDto>>.Success(summaries.OrderByDescending(item => item.LastMessageAt ?? DateTime.MinValue).ToList());
    }
}

public sealed class GetConversationMessagesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetConversationMessagesQuery, Result<IReadOnlyList<MessageDto>>>
{
    public Task<Result<IReadOnlyList<MessageDto>>> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Task.FromResult(Result<IReadOnlyList<MessageDto>>.Failure("Authentication is required."));

        var currentUserId = currentUser.UserId.Value;
        var ownsConversation = unitOfWork.Repository<Conversation>().Query()
            .Any(conversation => conversation.Id == request.ConversationId && conversation.CreatedBy == currentUserId);

        var messages = unitOfWork.Repository<Message>().Query()
            .Where(message =>
                message.ConversationId == request.ConversationId &&
                (message.SenderUserId == currentUserId || message.RecipientUserId == currentUserId))
            .OrderBy(message => message.CreatedAt)
            .Select(message => new MessageDto(message.Id, message.ConversationId, message.SenderUserId, message.RecipientUserId, message.Body, message.CreatedAt, message.ReadAt))
            .ToList();

        if (messages.Count() == 0 && !ownsConversation)
            return Task.FromResult(Result<IReadOnlyList<MessageDto>>.Failure("Conversation not found."));

        return Task.FromResult(Result<IReadOnlyList<MessageDto>>.Success(messages));
    }
}

public sealed class GetChatContactsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetChatContactsQuery, Result<IReadOnlyList<ChatContactDto>>>
{
    public Task<Result<IReadOnlyList<ChatContactDto>>> Handle(GetChatContactsQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Task.FromResult(Result<IReadOnlyList<ChatContactDto>>.Failure("Authentication is required."));

        var currentUserId = currentUser.UserId.Value;
        var currentRoles = unitOfWork.Repository<UserRole>().Query()
            .Where(userRole => userRole.UserId == currentUserId)
            .Select(userRole => userRole.Role.Name)
            .ToList();

        var allowedRoles = currentRoles.Contains("Admin")
            ? new[] { "Admin", "Student", "Company" }
            : currentRoles.Contains("Company")
                ? new[] { "Student", "Admin" }
                : new[] { "Company", "Admin" };

        var users = unitOfWork.Repository<User>().Query()
            .Where(user => user.IsActive && user.Id != currentUserId)
            .Select(user => new { user.Id, user.FirstName, user.LastName })
            .ToList();

        var userIds = users.Select(user => user.Id).ToList();
        var userRoles = unitOfWork.Repository<UserRole>().Query()
            .Where(userRole => userIds.Contains(userRole.UserId))
            .Select(userRole => new { userRole.UserId, RoleName = userRole.Role.Name })
            .ToList();

        var rolesByUser = userRoles
            .GroupBy(userRole => userRole.UserId)
            .ToDictionary(group => group.Key, group => group.Select(item => item.RoleName).Distinct().ToList());

        var contacts = users
            .Select(user =>
            {
                rolesByUser.TryGetValue(user.Id, out var roles);
                roles ??= [];
                var matchingRole = roles.FirstOrDefault(role => allowedRoles.Contains(role));
                if (matchingRole is null)
                    return null;

                return new ChatContactDto(user.Id, $"{user.FirstName} {user.LastName}", matchingRole);
            })
            .Where(contact => contact is not null)
            .Select(contact => contact!)
            .OrderBy(contact => contact.FullName)
            .ToList();

        return Task.FromResult(Result<IReadOnlyList<ChatContactDto>>.Success(contacts));
    }
}

internal static class ChatSummaryBuilder
{
    public static async Task<ConversationSummaryDto> BuildConversationSummaryAsync(
        IUnitOfWork unitOfWork,
        Guid currentUserId,
        Guid conversationId,
        CancellationToken cancellationToken,
        Guid? fallbackRecipientUserId = null)
    {
        var conversation = unitOfWork.Repository<Conversation>().Query()
            .Where(item => item.Id == conversationId)
            .Select(item => new { item.Id, item.Subject })
            .FirstOrDefault();

        var messages = unitOfWork.Repository<Message>().Query()
            .Where(message => message.ConversationId == conversationId)
            .Select(message => new
            {
                message.Id,
                message.ConversationId,
                message.SenderUserId,
                message.RecipientUserId,
                message.Body,
                message.CreatedAt,
                message.ReadAt
            })
            .OrderBy(message => message.CreatedAt)
            .ToList();

        var lastMessage = messages.LastOrDefault();
        var otherUserId = lastMessage is not null
            ? lastMessage.SenderUserId == currentUserId ? lastMessage.RecipientUserId : lastMessage.SenderUserId
            : fallbackRecipientUserId ?? Guid.Empty;

        var recipientInfo = await ResolveUserInfoAsync(unitOfWork, otherUserId, cancellationToken);
        var unreadCount = messages.Count(message => message.RecipientUserId == currentUserId && message.ReadAt is null);

        return new ConversationSummaryDto(
            conversationId,
            recipientInfo.UserId,
            recipientInfo.FullName,
            recipientInfo.Role,
            conversation?.Subject,
            lastMessage?.Body,
            lastMessage?.CreatedAt,
            unreadCount);
    }

    private static Task<(Guid UserId, string FullName, string Role)> ResolveUserInfoAsync(IUnitOfWork unitOfWork, Guid userId, CancellationToken cancellationToken)
    {
        if (userId == Guid.Empty)
            return Task.FromResult((Guid.Empty, "Unknown user", "Unknown"));

        var user = unitOfWork.Repository<User>().Query()
            .Where(item => item.Id == userId)
            .Select(item => new { item.Id, item.FirstName, item.LastName })
            .FirstOrDefault();

        var role = unitOfWork.Repository<UserRole>().Query()
            .Where(userRole => userRole.UserId == userId)
            .Select(userRole => userRole.Role.Name)
            .FirstOrDefault() ?? "Student";

        if (user is null)
            return Task.FromResult((userId, "Unknown user", role));

        return Task.FromResult((user.Id, $"{user.FirstName} {user.LastName}", role));
    }
}

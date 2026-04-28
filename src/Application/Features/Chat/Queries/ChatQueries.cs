using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Chat.Queries;

public sealed class GetChatConversationsQuery : IRequest<Result<IReadOnlyList<ConversationSummaryDto>>>;

public sealed record GetConversationMessagesQuery(Guid ConversationId) : IRequest<Result<IReadOnlyList<MessageDto>>>;

public sealed class GetChatContactsQuery : IRequest<Result<IReadOnlyList<ChatContactDto>>>;

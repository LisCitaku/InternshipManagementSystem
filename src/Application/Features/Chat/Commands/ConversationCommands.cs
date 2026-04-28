using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Chat.Commands;

public sealed record CreateConversationCommand(CreateConversationRequestDto Request) : IRequest<Result<ConversationSummaryDto>>;

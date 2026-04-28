using Application.DTOs;
using Application.Features.Chat.Commands;
using Application.Features.Chat.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize]
public sealed class ChatController(IMediator mediator) : ApiControllerBase
{
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetChatConversationsQuery(), cancellationToken));

    [HttpGet("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> GetConversationMessages(Guid conversationId, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetConversationMessagesQuery(conversationId), cancellationToken));

    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts(CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetChatContactsQuery(), cancellationToken));

    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new CreateConversationCommand(request), cancellationToken));

    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage(SendMessageRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new SendMessageCommand(request), cancellationToken));
}

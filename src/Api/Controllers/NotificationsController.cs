using Application.Features.Notifications.Queries;
using Application.Features.Notifications.Handlers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize]
public sealed class NotificationsController(IMediator mediator) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetNotificationsQuery query, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(query, cancellationToken));

    [HttpPut("{notificationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead([FromRoute] Guid notificationId, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new MarkNotificationAsReadCommand { NotificationId = notificationId }, cancellationToken));

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new MarkAllNotificationsAsReadCommand(), cancellationToken));
}

using Application.Features.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Roles = "Admin")]
public sealed class RecruiterRequestsController(IMediator mediator) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPending(CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetPendingRecruiterRequestsQuery(), cancellationToken));

    [HttpPut("{requestId:guid}/approve")]
    public async Task<IActionResult> Approve([FromRoute] Guid requestId, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new ApproveRecruiterRequestCommand(requestId), cancellationToken));

    [HttpPut("{requestId:guid}/reject")]
    public async Task<IActionResult> Reject([FromRoute] Guid requestId, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new RejectRecruiterRequestCommand(requestId), cancellationToken));
}

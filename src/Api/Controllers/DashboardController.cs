using Application.Features.Dashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public sealed class DashboardController(IMediator mediator) : ApiControllerBase
{
    [HttpGet("summary")]
    [Authorize]
    public async Task<IActionResult> Summary([FromQuery] string role, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetDashboardSummaryQuery(role), cancellationToken));
}

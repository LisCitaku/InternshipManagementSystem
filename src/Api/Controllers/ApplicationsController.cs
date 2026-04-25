using Application.DTOs;
using Application.Features.Applications.Commands;
using Application.Features.Applications.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize]
public sealed class ApplicationsController(IMediator mediator) : ApiControllerBase
{
    [Authorize(Roles = "Admin,Recruiter,Company")]
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetApplicationsQuery query, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(query, cancellationToken));

    [HttpGet("my")]
    public async Task<IActionResult> GetMine([FromQuery] GetApplicationsQuery query, CancellationToken cancellationToken)
    {
        query.Mine = true;
        return ToActionResult(await mediator.Send(query, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateApplicationRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new CreateApplicationCommand(request), cancellationToken));

    [Authorize(Roles = "Admin,Recruiter,Company")]
    [HttpPut("{applicationId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid applicationId, UpdateApplicationStatusRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new UpdateApplicationStatusCommand(applicationId, request), cancellationToken));
}

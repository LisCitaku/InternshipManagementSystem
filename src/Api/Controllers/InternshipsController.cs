using Application.DTOs;
using Application.Features.Internships.Commands;
using Application.Features.Internships.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public sealed class InternshipsController(IMediator mediator) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] SearchInternshipsQuery query, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(query, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetInternshipByIdQuery(id), cancellationToken));

    [Authorize(Roles = "Admin,Recruiter,Company")]
    [HttpPost]
    public async Task<IActionResult> Create(CreateInternshipRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new CreateInternshipCommand(request), cancellationToken));

    [Authorize(Roles = "Admin,Recruiter,Company")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new DeleteInternshipCommand(id), cancellationToken));

    [Authorize(Roles = "Admin,Recruiter,Company")]
    [HttpPut("{id:guid}/capacity")]
    [HttpPut("{id:guid}/reopen")]
    public async Task<IActionResult> UpdateCapacity(Guid id, [FromBody] UpdateInternshipCapacityRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new UpdateInternshipCapacityCommand(id, request), cancellationToken));
}

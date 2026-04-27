using Application.Features.Companies.Queries;
using Application.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers;

public sealed class CompaniesController(IMediator mediator) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetCompaniesQuery query, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(query, cancellationToken));

    [HttpGet("{companyId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid companyId, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetCompanyByIdQuery(companyId), cancellationToken));

    [HttpGet("my-company")]
    [Authorize]
    public async Task<IActionResult> GetMyCompany(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        return ToActionResult(await mediator.Send(new GetCurrentUserCompanyQuery(userIdGuid), cancellationToken));
    }

    [HttpPut("my-company")]
    [Authorize]
    public async Task<IActionResult> UpdateMyCompany([FromBody] UpdateCompanyRequestDto request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        return ToActionResult(await mediator.Send(new UpdateCurrentUserCompanyCommand(userIdGuid, request), cancellationToken));
    }

    [HttpPost("my-company")]
    [Authorize(Roles = "Admin,Recruiter,Company")]
    public async Task<IActionResult> CreateMyCompany([FromBody] CreateCompanyRequestDto request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var userIdGuid))
            return Unauthorized();

        return ToActionResult(await mediator.Send(new CreateCompanyCommand(userIdGuid, request), cancellationToken));
    }

    [HttpPut("{companyId:guid}/users/{userId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> LinkUserToCompany(Guid companyId, Guid userId, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new LinkCompanyToUserCommand(companyId, userId), cancellationToken));
}

using Application.DTOs;
using Application.Features.Cms;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public sealed class CmsController(IMediator mediator) : ApiControllerBase
{
    [AllowAnonymous]
    [HttpGet("{pageKey}")]
    public async Task<IActionResult> Get(string pageKey, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetCmsPageQuery(pageKey), cancellationToken));

    [Authorize(Roles = "Admin")]
    [HttpPut("{pageKey}")]
    public async Task<IActionResult> Update(string pageKey, CmsPageUpdateRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new UpsertCmsPageCommand(pageKey, request), cancellationToken));
}

using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using Application.Interfaces;
using Api.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public sealed class UsersController(IMediator mediator, IProfileAssetService profileAssets) : ApiControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetCurrentUserQuery(), cancellationToken));

    [HttpGet("me/profile")]
    [Authorize]
    public async Task<IActionResult> GetCurrentProfile(CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GetCurrentUserProfileQuery(), cancellationToken));

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Get([FromQuery] GetUsersQuery query, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(query, cancellationToken));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new CreateUserCommand(request), cancellationToken));

    [HttpPut("{userId:guid}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(Guid userId, [FromBody] UpdateUserRoleRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new UpdateUserRoleCommand(userId, request), cancellationToken));

    [HttpPut("{userId:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(Guid userId, [FromBody] UpdateUserStatusRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new UpdateUserStatusCommand(userId, request), cancellationToken));

    [HttpPut("me/profile")]
    [Authorize]
    public async Task<IActionResult> UpdateCurrentProfile([FromBody] UpdateCurrentUserProfileRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new UpdateCurrentUserProfileCommand(request), cancellationToken));

    [HttpPost("me/avatar")]
    [Authorize]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return ToActionResult(Result<CurrentUserProfileDto>.Failure("Avatar file is empty."));

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var profile = await profileAssets.UploadAvatarAsync(new ProfileFileUploadRequestDto(memoryStream.ToArray(), file.FileName, file.ContentType), cancellationToken);
        return ToActionResult(Result<CurrentUserProfileDto>.Success(profile));
    }

    [HttpPost("me/cv")]
    [Authorize]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadCv([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return ToActionResult(Result<CurrentUserProfileDto>.Failure("CV file is empty."));

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var profile = await profileAssets.UploadCvAsync(new ProfileFileUploadRequestDto(memoryStream.ToArray(), file.FileName, file.ContentType), cancellationToken);
        return ToActionResult(Result<CurrentUserProfileDto>.Success(profile));
    }
}

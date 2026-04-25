using Application.DTOs;
using Application.Features.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public sealed class AuthController(IMediator mediator) : ApiControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new RegisterCommand(request), cancellationToken));

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new LoginCommand(request), cancellationToken));

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(RefreshTokenRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new RefreshTokenCommand(request), cancellationToken));
}


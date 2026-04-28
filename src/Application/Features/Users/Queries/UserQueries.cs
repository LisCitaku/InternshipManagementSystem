using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public sealed class GetUsersQuery : PagedQuery, IRequest<Result<PagedResult<UserDto>>>
{
    public string? Role { get; set; }
}

public sealed class GetCurrentUserQuery : IRequest<Result<UserDto>>;
public sealed class GetCurrentUserProfileQuery : IRequest<Result<CurrentUserProfileDto>>;

public sealed record CreateUserCommand(CreateUserRequestDto Request) : IRequest<Result<UserDto>>;
public sealed record UpdateUserRoleCommand(Guid UserId, UpdateUserRoleRequestDto Request) : IRequest<Result<UserDto>>;
public sealed record UpdateUserStatusCommand(Guid UserId, UpdateUserStatusRequestDto Request) : IRequest<Result<UserDto>>;
public sealed record UpdateCurrentUserProfileCommand(UpdateCurrentUserProfileRequestDto Request) : IRequest<Result<CurrentUserProfileDto>>;

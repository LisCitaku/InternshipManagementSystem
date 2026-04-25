using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Auth.Commands;

public sealed record RegisterCommand(RegisterRequestDto Request) : IRequest<Result<AuthResponseDto>>;
public sealed record LoginCommand(LoginRequestDto Request) : IRequest<Result<AuthResponseDto>>;
public sealed record RefreshTokenCommand(RefreshTokenRequestDto Request) : IRequest<Result<AuthResponseDto>>;
public sealed record GetPendingRecruiterRequestsQuery() : IRequest<Result<IReadOnlyList<RecruiterApprovalRequestDto>>>;
public sealed record ApproveRecruiterRequestCommand(Guid RequestId) : IRequest<Result<bool>>;
public sealed record RejectRecruiterRequestCommand(Guid RequestId) : IRequest<Result<bool>>;

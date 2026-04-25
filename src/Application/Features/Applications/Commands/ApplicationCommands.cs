using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Applications.Commands;

public sealed record CreateApplicationCommand(CreateApplicationRequestDto Request) : IRequest<Result<ApplicationDto>>;
public sealed record UpdateApplicationStatusCommand(Guid ApplicationId, UpdateApplicationStatusRequestDto Request) : IRequest<Result<ApplicationDto>>;

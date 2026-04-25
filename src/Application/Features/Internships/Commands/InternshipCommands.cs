using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Internships.Commands;

public sealed record CreateInternshipCommand(CreateInternshipRequestDto Request) : IRequest<Result<InternshipDto>>;
public sealed record DeleteInternshipCommand(Guid InternshipId) : IRequest<Result<bool>>;
public sealed record UpdateInternshipCapacityCommand(Guid InternshipId, UpdateInternshipCapacityRequestDto Request) : IRequest<Result<InternshipDto>>;

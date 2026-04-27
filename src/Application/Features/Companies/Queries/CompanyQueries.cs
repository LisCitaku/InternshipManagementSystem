using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Companies.Queries;

public sealed class GetCompaniesQuery : PagedQuery, IRequest<Result<PagedResult<CompanyDto>>>;

public sealed record GetCompanyByIdQuery(Guid CompanyId) : IRequest<Result<CompanyDto>>;
public sealed record GetCurrentUserCompanyQuery(Guid UserId) : IRequest<Result<CompanyDto?>>;
public sealed record CreateCompanyCommand(Guid UserId, CreateCompanyRequestDto Request) : IRequest<Result<CompanyDto>>;
public sealed record LinkCompanyToUserCommand(Guid CompanyId, Guid UserId) : IRequest<Result<CompanyDto>>;
public sealed record UpdateCurrentUserCompanyCommand(Guid UserId, UpdateCompanyRequestDto Request) : IRequest<Result<CompanyDto>>;

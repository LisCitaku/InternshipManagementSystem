using Application.Common;
using Application.DTOs;
using Application.Features.Companies.Queries;
using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.Companies.Handlers;

public sealed class GetCompaniesQueryHandler(IUnitOfWork unitOfWork, ICacheService cacheService) : IRequestHandler<GetCompaniesQuery, Result<PagedResult<CompanyDto>>>
{
    public async Task<Result<PagedResult<CompanyDto>>> Handle(GetCompaniesQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"catalog:companies:{request.PageNumber}:{request.PageSize}:{request.Search}:{request.SortBy}:{request.Descending}";
        var cached = await cacheService.GetAsync<Result<PagedResult<CompanyDto>>>(cacheKey, cancellationToken);
        if (cached is not null)
            return cached;

        var query = unitOfWork.Repository<Company>().Query();
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Name.Contains(request.Search) || (x.Location != null && x.Location.Contains(request.Search)));

        query = request.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.Name);
        var total = query.Count();
        var items = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(x => new CompanyDto(x.Id, x.Name, x.Description, x.Website, x.Location, x.IsVerified)).ToList();
        var result = Result<PagedResult<CompanyDto>>.Success(new PagedResult<CompanyDto>(items, request.PageNumber, request.PageSize, total));
        await cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(2), cancellationToken);
        return result;
    }
}

public sealed class GetCompanyByIdQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetCompanyByIdQuery, Result<CompanyDto>>
{
    public Task<Result<CompanyDto>> Handle(GetCompanyByIdQuery request, CancellationToken cancellationToken)
    {
        var company = unitOfWork.Repository<Company>().Query().FirstOrDefault(x => x.Id == request.CompanyId);
        return Task.FromResult(company is null
            ? Result<CompanyDto>.Failure("Company was not found.")
            : Result<CompanyDto>.Success(new CompanyDto(company.Id, company.Name, company.Description, company.Website, company.Location, company.IsVerified)));
    }
}

public sealed class GetCurrentUserCompanyQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetCurrentUserCompanyQuery, Result<CompanyDto?>>
{
    public async Task<Result<CompanyDto?>> Handle(GetCurrentUserCompanyQuery request, CancellationToken cancellationToken)
    {
        var companyUser = unitOfWork.Repository<CompanyUser>()
            .Query()
            .Where(x => x.UserId == request.UserId)
            .Select(x => x.Company)
            .FirstOrDefault();

        if (companyUser is null)
            return await Task.FromResult(Result<CompanyDto?>.Success(null));

        var dto = new CompanyDto(companyUser.Id, companyUser.Name, companyUser.Description, companyUser.Website, companyUser.Location, companyUser.IsVerified);
        return await Task.FromResult(Result<CompanyDto?>.Success(dto));
    }
}

public sealed class CreateCompanyCommandHandler(IUnitOfWork unitOfWork, ICacheService cacheService, INotificationDispatcher notifications) : IRequestHandler<CreateCompanyCommand, Result<CompanyDto>>
{
    public async Task<Result<CompanyDto>> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        var existing = unitOfWork.Repository<CompanyUser>()
            .Query()
            .Any(x => x.UserId == request.UserId);

        if (existing)
            return Result<CompanyDto>.Failure("Your account is already linked to a company.");

        var company = new Company
        {
            Name = request.Request.Name.Trim(),
            Website = string.IsNullOrWhiteSpace(request.Request.Website) ? null : request.Request.Website.Trim(),
            Location = string.IsNullOrWhiteSpace(request.Request.Location) ? null : request.Request.Location.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Request.Description) ? null : request.Request.Description.Trim()
        };

        await unitOfWork.Repository<Company>().AddAsync(company, cancellationToken);
        await unitOfWork.Repository<CompanyUser>().AddAsync(new CompanyUser
        {
            Company = company,
            UserId = request.UserId,
            Position = "Recruiter"
        }, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:companies", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("companies", cancellationToken);
        return Result<CompanyDto>.Success(new CompanyDto(company.Id, company.Name, company.Description, company.Website, company.Location, company.IsVerified));
    }
}

public sealed class LinkCompanyToUserCommandHandler(IUnitOfWork unitOfWork, ICacheService cacheService, INotificationDispatcher notifications) : IRequestHandler<LinkCompanyToUserCommand, Result<CompanyDto>>
{
    public async Task<Result<CompanyDto>> Handle(LinkCompanyToUserCommand request, CancellationToken cancellationToken)
    {
        var company = unitOfWork.Repository<Company>().Query().FirstOrDefault(x => x.Id == request.CompanyId);
        if (company is null)
            return Result<CompanyDto>.Failure("Company was not found.");

        var existing = unitOfWork.Repository<CompanyUser>().Query().FirstOrDefault(x => x.UserId == request.UserId);
        if (existing is null)
        {
            await unitOfWork.Repository<CompanyUser>().AddAsync(new CompanyUser
            {
                CompanyId = request.CompanyId,
                UserId = request.UserId,
                Position = "Recruiter"
            }, cancellationToken);
        }
        else
        {
            existing.CompanyId = request.CompanyId;
            unitOfWork.Repository<CompanyUser>().Update(existing);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:companies", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("companies", cancellationToken);
        return Result<CompanyDto>.Success(new CompanyDto(company.Id, company.Name, company.Description, company.Website, company.Location, company.IsVerified));
    }
}

public sealed class UpdateCurrentUserCompanyCommandHandler(IUnitOfWork unitOfWork, ICacheService cacheService, INotificationDispatcher notifications) : IRequestHandler<UpdateCurrentUserCompanyCommand, Result<CompanyDto>>
{
    public async Task<Result<CompanyDto>> Handle(UpdateCurrentUserCompanyCommand request, CancellationToken cancellationToken)
    {
        var companyUser = unitOfWork.Repository<CompanyUser>()
            .Query()
            .Where(x => x.UserId == request.UserId)
            .Select(x => x.Company)
            .FirstOrDefault();

        if (companyUser is null)
            return Result<CompanyDto>.Failure("No company is linked to this account.");

        companyUser.Name = request.Request.Name.Trim();
        companyUser.Website = string.IsNullOrWhiteSpace(request.Request.Website) ? null : request.Request.Website.Trim();
        companyUser.Location = string.IsNullOrWhiteSpace(request.Request.Location) ? null : request.Request.Location.Trim();
        companyUser.Description = string.IsNullOrWhiteSpace(request.Request.Description) ? null : request.Request.Description.Trim();

        unitOfWork.Repository<Company>().Update(companyUser);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:companies", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("companies", cancellationToken);

        var dto = new CompanyDto(companyUser.Id, companyUser.Name, companyUser.Description, companyUser.Website, companyUser.Location, companyUser.IsVerified);
        return Result<CompanyDto>.Success(dto);
    }
}

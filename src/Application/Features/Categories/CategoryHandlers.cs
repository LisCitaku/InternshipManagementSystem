using Application.Common;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.Categories;

public sealed class GetCategoriesQueryHandler(IUnitOfWork unitOfWork, ICacheService cacheService)
    : IRequestHandler<GetCategoriesQuery, Result<PagedResult<CategoryDto>>>
{
    public async Task<Result<PagedResult<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"catalog:categories:{request.PageNumber}:{request.PageSize}:{request.Search}:{request.SortBy}:{request.Descending}";
        var cached = await cacheService.GetAsync<Result<PagedResult<CategoryDto>>>(cacheKey, cancellationToken);
        if (cached is not null)
            return cached;

        var query = unitOfWork.Repository<Category>().Query();
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Name.Contains(request.Search));

        query = request.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.Name);
        var total = query.Count();
        var items = query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new CategoryDto(x.Id, x.Name, x.Description))
            .ToList();

        var result = Result<PagedResult<CategoryDto>>.Success(new PagedResult<CategoryDto>(items, request.PageNumber, request.PageSize, total));
        await cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(2), cancellationToken);
        return result;
    }
}

using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Categories;

public sealed class GetCategoriesQuery : PagedQuery, IRequest<Result<PagedResult<CategoryDto>>>;

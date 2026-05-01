using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Cms;

public sealed record GetCmsPageQuery(string PageKey) : IRequest<Result<CmsPageDto>>;

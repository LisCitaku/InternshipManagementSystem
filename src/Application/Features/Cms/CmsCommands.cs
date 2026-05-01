using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Cms;

public sealed record UpsertCmsPageCommand(string PageKey, CmsPageUpdateRequestDto Request) : IRequest<Result<CmsPageDto>>;

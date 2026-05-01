using Application.Common;
using Application.DTOs;
using Application.Interfaces;
using MediatR;

namespace Application.Features.Cms;

public sealed class GetCmsPageQueryHandler(ICmsService cmsService) : IRequestHandler<GetCmsPageQuery, Result<CmsPageDto>>
{
    public async Task<Result<CmsPageDto>> Handle(GetCmsPageQuery request, CancellationToken cancellationToken) =>
        Result<CmsPageDto>.Success(await cmsService.GetPageAsync(request.PageKey, cancellationToken));
}

public sealed class UpsertCmsPageCommandHandler(ICmsService cmsService) : IRequestHandler<UpsertCmsPageCommand, Result<CmsPageDto>>
{
    public async Task<Result<CmsPageDto>> Handle(UpsertCmsPageCommand request, CancellationToken cancellationToken) =>
        Result<CmsPageDto>.Success(await cmsService.UpsertPageAsync(request.PageKey, request.Request, cancellationToken));
}

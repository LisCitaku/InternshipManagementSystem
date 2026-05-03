using Application.Common;
using Application.DTOs;
using Application.Interfaces;
using MediatR;

namespace Application.Features.DataTransfer;

public sealed class ImportDataCommandHandler(IImportService importService) : IRequestHandler<ImportDataCommand, Result<ImportResultDto>>
{
    public async Task<Result<ImportResultDto>> Handle(ImportDataCommand request, CancellationToken cancellationToken)
    {
        await using var stream = new MemoryStream(request.Content);
        return Result<ImportResultDto>.Success(await importService.ImportAsync(request.Request, stream, cancellationToken));
    }
}

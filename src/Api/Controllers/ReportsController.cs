using Application.Common;
using Application.DTOs;
using Application.Features.DataTransfer;
using Application.Features.Reports.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Roles = "Admin,Company")]
public sealed class ReportsController(IMediator mediator) : ApiControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate(ReportRequestDto request, CancellationToken cancellationToken) =>
        ToActionResult(await mediator.Send(new GenerateReportQuery(request), cancellationToken));

    [HttpPost("export")]
    public async Task<IActionResult> Export(ExportRequestDto request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ExportDataQuery(request), cancellationToken);
        if (!result.Succeeded)
            return ToActionResult(result);

        return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
    }

    [HttpPost("import")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Import([FromForm] string entity, [FromForm] string format, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return ToActionResult(Result<ImportResultDto>.Failure("File is empty."));

        await using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var command = new ImportDataCommand(new ImportRequestDto(entity, format), file.FileName, memoryStream.ToArray());
        var result = await mediator.Send(command, cancellationToken);
        return ToActionResult(result);
    }
}

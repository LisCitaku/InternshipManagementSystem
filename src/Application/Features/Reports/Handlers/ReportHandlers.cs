using Application.Common;
using Application.DTOs;
using Application.Features.Reports.Queries;
using Application.Interfaces;
using MediatR;

namespace Application.Features.Reports.Handlers;

public sealed class GenerateReportQueryHandler(IReportService reports) : IRequestHandler<GenerateReportQuery, Result<ReportDto>>
{
    public async Task<Result<ReportDto>> Handle(GenerateReportQuery request, CancellationToken cancellationToken) =>
        Result<ReportDto>.Success(await reports.GenerateAsync(request.Request, cancellationToken));
}

public sealed class ExportDataQueryHandler(IExportService exports)
    : IRequestHandler<ExportDataQuery, Result<(byte[] Content, string ContentType, string FileName)>>
{
    public async Task<Result<(byte[] Content, string ContentType, string FileName)>> Handle(ExportDataQuery request, CancellationToken cancellationToken) =>
        Result<(byte[] Content, string ContentType, string FileName)>.Success(await exports.ExportAsync(request.Request, cancellationToken));
}


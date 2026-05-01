using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Reports.Queries;

public sealed record GenerateReportQuery(ReportRequestDto Request) : IRequest<Result<ReportDto>>;
public sealed record ExportDataQuery(ExportRequestDto Request) : IRequest<Result<(byte[] Content, string ContentType, string FileName)>>;


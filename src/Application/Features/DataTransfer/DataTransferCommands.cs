using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.DataTransfer;

public sealed record ImportDataCommand(ImportRequestDto Request, string FileName, byte[] Content) : IRequest<Result<ImportResultDto>>;

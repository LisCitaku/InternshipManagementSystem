using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Internships.Queries;

public sealed class SearchInternshipsQuery : PagedQuery, IRequest<Result<PagedResult<InternshipDto>>>
{
    public Guid? CompanyId { get; set; }
    public Guid? CategoryId { get; set; }
    public string? Location { get; set; }
    public string? Type { get; set; }
    public bool IncludeInactive { get; set; }
}

public sealed record GetInternshipByIdQuery(Guid Id) : IRequest<Result<InternshipDto>>;

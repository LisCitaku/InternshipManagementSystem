using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Applications.Queries;

public sealed class GetApplicationsQuery : PagedQuery, IRequest<Result<PagedResult<ApplicationDto>>>
{
    public Guid? InternshipId { get; set; }
    public Guid? ApplicantUserId { get; set; }
    public bool Mine { get; set; }
}

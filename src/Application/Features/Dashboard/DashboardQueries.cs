using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Dashboard;

public sealed record GetDashboardSummaryQuery(string Role) : IRequest<Result<DashboardSummaryDto>>;

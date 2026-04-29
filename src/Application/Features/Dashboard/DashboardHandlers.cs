using Application.Common;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Features.Dashboard;

public sealed class GetDashboardSummaryQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetDashboardSummaryQuery, Result<DashboardSummaryDto>>
{
    public Task<Result<DashboardSummaryDto>> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var role = request.Role?.Trim();
        if (string.IsNullOrWhiteSpace(role))
            role = "Student";

        var today = DateTime.UtcNow.Date;
        var days = Enumerable.Range(0, 7).Select(offset => today.AddDays(-6 + offset)).ToList();

        var metrics = new List<DashboardMetricDto>();
        var timeline = new List<DashboardPointDto>();
        var breakdown = new List<DashboardPointDto>();

        if (role == "Student")
        {
            if (currentUser.UserId is null)
                return Task.FromResult(Result<DashboardSummaryDto>.Failure("Authentication is required."));

            var userId = currentUser.UserId.Value;
            var applications = unitOfWork.Repository<JobApplication>().Query()
                .Where(x => x.ApplicantUserId == userId)
                .Select(x => new
                {
                    x.CreatedAt,
                    StatusName = x.Status != null ? x.Status.Name : string.Empty
                })
                .ToList();
            var savedJobs = unitOfWork.Repository<SavedJob>().Query().Count(x => x.UserId == userId);
            var unreadNotifications = unitOfWork.Repository<Notification>().Query().Count(x => x.UserId == userId && !x.IsRead);
            var accepted = applications.Count(x => x.StatusName == "Accepted");

            metrics.AddRange([
                new("Applications", applications.Count.ToString(), "+ live", "sky"),
                new("Saved jobs", savedJobs.ToString(), "tracked", "mint"),
                new("Unread updates", unreadNotifications.ToString(), "inbox", "amber"),
                new("Accepted", accepted.ToString(), "outcomes", "coral")
            ]);

            timeline.AddRange(days.Select(day => new DashboardPointDto(day.ToString("ddd"), applications.Count(x => x.CreatedAt.Date == day))));
            breakdown.AddRange(applications
                .GroupBy(x => string.IsNullOrWhiteSpace(x.StatusName) ? "Unknown" : x.StatusName)
                .Select(x => new DashboardPointDto(x.Key, x.Count()))
                .ToList());
        }
        else if (role is "Recruiter" or "Company")
        {
            if (currentUser.UserId is null)
                return Task.FromResult(Result<DashboardSummaryDto>.Failure("Authentication is required."));

            var companyId = unitOfWork.Repository<CompanyUser>().Query()
                .Where(x => x.UserId == currentUser.UserId.Value)
                .Select(x => (Guid?)x.CompanyId)
                .FirstOrDefault();

            if (companyId is null)
            {
                metrics.AddRange([
                    new("Open internships", "0", "no company link", "sky"),
                    new("Applicants", "0", "no company link", "mint"),
                    new("Interviews", "0", "no company link", "amber"),
                    new("Published", "0", "no company link", "coral")
                ]);
                return Task.FromResult(Result<DashboardSummaryDto>.Success(new DashboardSummaryDto(metrics, timeline, breakdown)));
            }

            var internships = unitOfWork.Repository<Internship>().Query()
                .Where(x => x.CompanyId == companyId.Value)
                .Select(x => new { x.Id, x.CreatedAt, x.Status })
                .ToList();

            var internshipIds = internships.Select(x => x.Id).ToList();
            var applications = unitOfWork.Repository<JobApplication>().Query()
                .Where(x => internshipIds.Contains(x.InternshipId))
                .Select(x => new { x.CreatedAt, StatusName = x.Status != null ? x.Status.Name : string.Empty, x.Id })
                .ToList();
            var published = internships.Count(x => x.Status == InternshipStatus.Published);
            var applicationIds = applications.Select(x => x.Id).ToList();
            var interviews = unitOfWork.Repository<Interview>().Query().Count(x => applicationIds.Contains(x.ApplicationId));

            metrics.AddRange([
                new("Open internships", internships.Count.ToString(), published.ToString(), "sky"),
                new("Applicants", applications.Count.ToString(), "+ live", "mint"),
                new("Interviews", interviews.ToString(), "scheduled", "amber"),
                new("Published", published.ToString(), "live", "coral")
            ]);

            timeline.AddRange(days.Select(day => new DashboardPointDto(day.ToString("ddd"), applications.Count(x => x.CreatedAt.Date == day))));
            breakdown.AddRange(internships.GroupBy(x => x.Status.ToString()).Select(x => new DashboardPointDto(x.Key, x.Count())).ToList());
        }
        else
        {
            var users = unitOfWork.Repository<User>().Query().Select(x => new { x.CreatedAt, x.IsActive }).ToList();
            var companies = unitOfWork.Repository<Company>().Query().Select(x => new { x.CreatedAt }).ToList();
            var internships = unitOfWork.Repository<Internship>().Query().Select(x => new { x.CreatedAt }).ToList();
            var applications = unitOfWork.Repository<JobApplication>().Query().Select(x => new { x.CreatedAt }).ToList();

            metrics.AddRange([
                new("Users", users.Count.ToString(), "active platform", "sky"),
                new("Companies", companies.Count.ToString(), "onboarded", "mint"),
                new("Internships", internships.Count.ToString(), "catalog", "amber"),
                new("Applications", applications.Count.ToString(), "flow", "coral")
            ]);

            timeline.AddRange(days.Select(day => new DashboardPointDto(day.ToString("ddd"), applications.Count(x => x.CreatedAt.Date == day))));
            breakdown.AddRange(users.GroupBy(x => x.IsActive ? "Active" : "Inactive").Select(x => new DashboardPointDto(x.Key, x.Count())).ToList());
        }

        return Task.FromResult(Result<DashboardSummaryDto>.Success(new DashboardSummaryDto(metrics, timeline, breakdown)));
    }
}

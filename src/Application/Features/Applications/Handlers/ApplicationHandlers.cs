using Application.Common;
using Application.DTOs;
using Application.Features.Applications.Commands;
using Application.Features.Applications.Queries;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using System.Text.Json;

namespace Application.Features.Applications.Handlers;

public sealed class GetApplicationsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetApplicationsQuery, Result<PagedResult<ApplicationDto>>>
{
    public Task<Result<PagedResult<ApplicationDto>>> Handle(GetApplicationsQuery request, CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<JobApplication>().Query();

        if (request.Mine)
        {
            if (currentUser.UserId is null)
                return Task.FromResult(Result<PagedResult<ApplicationDto>>.Failure("Authentication is required."));

            query = query.Where(x => x.ApplicantUserId == currentUser.UserId.Value);
        }

        if (request.InternshipId.HasValue)
            query = query.Where(x => x.InternshipId == request.InternshipId.Value);
        if (request.ApplicantUserId.HasValue)
            query = query.Where(x => x.ApplicantUserId == request.ApplicantUserId.Value);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x =>
                x.Internship.Title.Contains(request.Search) ||
                x.ApplicantUser.Email.Contains(request.Search) ||
                x.ApplicantUser.FirstName.Contains(request.Search) ||
                x.ApplicantUser.LastName.Contains(request.Search));

        query = request.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt);
        var total = query.Count();
        var items = query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new ApplicationDto(
                x.Id,
                x.InternshipId,
                x.Internship.Title,
                x.ApplicantUserId,
                x.ApplicantUser.FirstName + " " + x.ApplicantUser.LastName,
                x.Status.Name,
                x.CreatedAt,
                x.CoverLetter,
                x.ResumeUrl))
            .ToList();

        return Task.FromResult(Result<PagedResult<ApplicationDto>>.Success(new PagedResult<ApplicationDto>(items, request.PageNumber, request.PageSize, total)));
    }
}

public sealed class CreateApplicationCommandHandler(
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUser,
    INotificationDispatcher notifications)
    : IRequestHandler<CreateApplicationCommand, Result<ApplicationDto>>
{
    public async Task<Result<ApplicationDto>> Handle(CreateApplicationCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<ApplicationDto>.Failure("Authentication is required.");

        var internship = unitOfWork.Repository<Internship>().Query().FirstOrDefault(x => x.Id == request.Request.InternshipId);
        if (internship is null)
            return Result<ApplicationDto>.Failure("Internship was not found.");

        if (internship.Status != InternshipStatus.Published || internship.CurrentApplicants >= internship.MaxApplicants)
            return Result<ApplicationDto>.Failure("This opportunity is full or closed.");

        var alreadyApplied = unitOfWork.Repository<JobApplication>().Query()
            .Any(x => x.InternshipId == request.Request.InternshipId && x.ApplicantUserId == currentUser.UserId.Value);
        if (alreadyApplied)
            return Result<ApplicationDto>.Failure("You have already applied to this internship.");

        var defaultStatus = unitOfWork.Repository<ApplicationStatus>().Query().OrderBy(x => x.SortOrder).FirstOrDefault();
        if (defaultStatus is null)
            return Result<ApplicationDto>.Failure("Application statuses are not configured.");

        var application = new JobApplication
        {
            InternshipId = request.Request.InternshipId,
            ApplicantUserId = currentUser.UserId.Value,
            StatusId = defaultStatus.Id,
            CoverLetter = BuildApplicationPayload(request.Request),
            ResumeUrl = request.Request.ResumeUrl,
            CreatedBy = currentUser.UserId
        };

        await unitOfWork.Repository<JobApplication>().AddAsync(application, cancellationToken);
        internship.CurrentApplicants += 1;
        if (internship.CurrentApplicants >= internship.MaxApplicants)
            internship.Status = InternshipStatus.Closed;
        internship.UpdatedBy = currentUser.UserId;
        unitOfWork.Repository<Internship>().Update(internship);

        var notification = new Notification
        {
            UserId = currentUser.UserId.Value,
            Title = "Application submitted",
            Body = "Your application has been submitted successfully.",
            Type = Domain.Enums.NotificationType.Application,
            CreatedBy = currentUser.UserId
        };
        await unitOfWork.Repository<Notification>().AddAsync(notification, cancellationToken);

        var recruiterUserIds = unitOfWork.Repository<CompanyUser>().Query()
            .Where(x => x.CompanyId == internship.CompanyId)
            .Select(x => x.UserId)
            .Distinct()
            .ToList();

        var recruiterNotifications = new List<Notification>();

        foreach (var recruiterUserId in recruiterUserIds)
        {
            var recruiterNotification = new Notification
            {
                UserId = recruiterUserId,
                Title = "New application received",
                Body = $"{currentUser.Email ?? "A student"} applied to {internship.Title}.",
                Type = Domain.Enums.NotificationType.Application,
                CreatedBy = currentUser.UserId
            };

            recruiterNotifications.Add(recruiterNotification);
            await unitOfWork.Repository<Notification>().AddAsync(recruiterNotification, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("applications", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("internships", cancellationToken);

        var dto = unitOfWork.Repository<JobApplication>().Query()
            .Where(x => x.Id == application.Id)
            .Select(x => new ApplicationDto(
                x.Id,
                x.InternshipId,
                x.Internship.Title,
                x.ApplicantUserId,
                x.ApplicantUser.FirstName + " " + x.ApplicantUser.LastName,
                x.Status.Name,
                x.CreatedAt,
                x.CoverLetter,
                x.ResumeUrl))
            .First();

        await notifications.DispatchAsync(new NotificationDto(notification.Id, notification.UserId, notification.Title,
            notification.Body, notification.Type, notification.IsRead, notification.CreatedAt), cancellationToken);

        foreach (var recruiterNotification in recruiterNotifications)
        {
            await notifications.DispatchAsync(new NotificationDto(
                recruiterNotification.Id,
                recruiterNotification.UserId,
                recruiterNotification.Title,
                recruiterNotification.Body,
                recruiterNotification.Type,
                recruiterNotification.IsRead,
                recruiterNotification.CreatedAt), cancellationToken);
        }

        await notifications.DispatchApplicationAlertAsync(recruiterUserIds, new
        {
            internshipId = internship.Id,
            internshipTitle = internship.Title,
            applicantUserId = currentUser.UserId.Value,
            applicantName = currentUser.Email ?? "Student",
            createdAt = DateTime.UtcNow
        }, cancellationToken);

        return Result<ApplicationDto>.Success(dto);
    }

    private static string? BuildApplicationPayload(CreateApplicationRequestDto request)
    {
        var structuredPayload = new
        {
            coverLetter = request.CoverLetter,
            phoneNumber = request.PhoneNumber,
            university = request.University,
            fieldOfStudy = request.FieldOfStudy,
            portfolioUrl = request.PortfolioUrl,
            githubUrl = request.GithubUrl
        };

        var hasStructuredData =
            !string.IsNullOrWhiteSpace(request.PhoneNumber) ||
            !string.IsNullOrWhiteSpace(request.University) ||
            !string.IsNullOrWhiteSpace(request.FieldOfStudy) ||
            !string.IsNullOrWhiteSpace(request.PortfolioUrl) ||
            !string.IsNullOrWhiteSpace(request.GithubUrl);

        if (!hasStructuredData && string.IsNullOrWhiteSpace(request.CoverLetter))
            return null;

        return JsonSerializer.Serialize(structuredPayload);
    }
}

public sealed class UpdateApplicationStatusCommandHandler(
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUser,
    INotificationDispatcher notifications)
    : IRequestHandler<UpdateApplicationStatusCommand, Result<ApplicationDto>>
{
    public async Task<Result<ApplicationDto>> Handle(UpdateApplicationStatusCommand request, CancellationToken cancellationToken)
    {
        var application = unitOfWork.Repository<JobApplication>().Query().FirstOrDefault(x => x.Id == request.ApplicationId);
        if (application is null)
            return Result<ApplicationDto>.Failure("Application was not found.");

        var statusName = request.Request.Status.Trim();
        var status = unitOfWork.Repository<ApplicationStatus>().Query().FirstOrDefault(x => x.Name == statusName);
        if (status is null)
            return Result<ApplicationDto>.Failure("Application status was not found.");

        if (application.StatusId == status.Id)
        {
            var unchangedDto = unitOfWork.Repository<JobApplication>().Query()
                .Where(x => x.Id == application.Id)
                .Select(x => new ApplicationDto(
                    x.Id,
                    x.InternshipId,
                    x.Internship.Title,
                    x.ApplicantUserId,
                    x.ApplicantUser.FirstName + " " + x.ApplicantUser.LastName,
                    x.Status.Name,
                    x.CreatedAt,
                    x.CoverLetter,
                    x.ResumeUrl))
                .First();

            return Result<ApplicationDto>.Success(unchangedDto);
        }

        application.StatusId = status.Id;
        application.UpdatedBy = currentUser.UserId;
        unitOfWork.Repository<JobApplication>().Update(application);

        var notification = new Notification
        {
            UserId = application.ApplicantUserId,
            Title = "Application status updated",
            Body = $"Your application status changed to {status.Name}.",
            Type = Domain.Enums.NotificationType.Application,
            CreatedBy = currentUser.UserId
        };
        await unitOfWork.Repository<Notification>().AddAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("applications", cancellationToken);

        var dto = unitOfWork.Repository<JobApplication>().Query()
            .Where(x => x.Id == application.Id)
            .Select(x => new ApplicationDto(
                x.Id,
                x.InternshipId,
                x.Internship.Title,
                x.ApplicantUserId,
                x.ApplicantUser.FirstName + " " + x.ApplicantUser.LastName,
                x.Status.Name,
                x.CreatedAt,
                x.CoverLetter,
                x.ResumeUrl))
            .First();

        await notifications.DispatchAsync(new NotificationDto(notification.Id, notification.UserId, notification.Title,
            notification.Body, notification.Type, notification.IsRead, notification.CreatedAt), cancellationToken);

        return Result<ApplicationDto>.Success(dto);
    }
}

using Application.Common;
using Application.DTOs;
using Application.Features.Internships.Commands;
using Application.Features.Internships.Queries;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Features.Internships.Handlers;

public sealed class SearchInternshipsQueryHandler(IUnitOfWork unitOfWork, ICacheService cacheService)
    : IRequestHandler<SearchInternshipsQuery, Result<PagedResult<InternshipDto>>>
{
    public async Task<Result<PagedResult<InternshipDto>>> Handle(SearchInternshipsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"catalog:internships:{request.PageNumber}:{request.PageSize}:{request.Search}:{request.CompanyId}:{request.CategoryId}:{request.Location}:{request.SortBy}:{request.Descending}:{request.IncludeInactive}";
        var cached = await cacheService.GetAsync<Result<PagedResult<InternshipDto>>>(cacheKey, cancellationToken);
        if (cached is not null)
            return cached;

        var query = unitOfWork.Repository<Internship>().Query();
        if (!request.IncludeInactive)
            query = query.Where(x => x.Status == InternshipStatus.Published && x.CurrentApplicants < x.MaxApplicants);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Title.Contains(request.Search) || x.Description.Contains(request.Search));
        if (request.CompanyId.HasValue)
            query = query.Where(x => x.CompanyId == request.CompanyId.Value);
        if (request.CategoryId.HasValue)
            query = query.Where(x => x.CategoryId == request.CategoryId.Value);
        if (!string.IsNullOrWhiteSpace(request.Location))
            query = query.Where(x => x.Location.Contains(request.Location));

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "deadline" => request.Descending ? query.OrderByDescending(x => x.DeadlineAt) : query.OrderBy(x => x.DeadlineAt),
            "salary" => request.Descending ? query.OrderByDescending(x => x.SalaryMax) : query.OrderBy(x => x.SalaryMin),
            _ => request.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt)
        };

        var total = query.Count();
        var internships = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize).ToList();
        var items = internships.Select(x => x.ToDto(unitOfWork)).ToList();
        var result = Result<PagedResult<InternshipDto>>.Success(new PagedResult<InternshipDto>(items, request.PageNumber, request.PageSize, total));
        await cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(2), cancellationToken);
        return result;
    }
}

public sealed class GetInternshipByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetInternshipByIdQuery, Result<InternshipDto>>
{
    public Task<Result<InternshipDto>> Handle(GetInternshipByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = unitOfWork.Repository<Internship>().Query().FirstOrDefault(x => x.Id == request.Id);
        return Task.FromResult(entity is null
            ? Result<InternshipDto>.Failure("Internship was not found.")
            : Result<InternshipDto>.Success(entity.ToDto(unitOfWork)));
    }
}

public sealed class CreateInternshipCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, ICacheService cacheService, INotificationDispatcher notifications)
    : IRequestHandler<CreateInternshipCommand, Result<InternshipDto>>
{
    public async Task<Result<InternshipDto>> Handle(CreateInternshipCommand request, CancellationToken cancellationToken)
    {
        var entity = new Internship
        {
            CompanyId = request.Request.CompanyId,
            CategoryId = request.Request.CategoryId,
            Title = request.Request.Title.Trim(),
            Description = request.Request.Description.Trim(),
            Location = request.Request.Location.Trim(),
            Type = request.Request.Type,
            MaxApplicants = request.Request.MaxApplicants,
            CurrentApplicants = 0,
            SalaryMin = request.Request.SalaryMin,
            SalaryMax = request.Request.SalaryMax,
            DeadlineAt = request.Request.DeadlineAt,
            Status = request.Request.PublishNow ? InternshipStatus.Published : InternshipStatus.Draft,
            CreatedBy = currentUser.UserId
        };

        await unitOfWork.Repository<Internship>().AddAsync(entity, cancellationToken);

        var studentIds = unitOfWork.Repository<UserRole>().Query()
            .Where(x => x.Role.Name == "Student")
            .Select(x => x.UserId)
            .Distinct()
            .ToList();

        var studentNotifications = new List<Notification>();

        if (entity.Status == InternshipStatus.Published && studentIds.Count > 0)
        {
            foreach (var studentId in studentIds)
            {
                var studentNotification = new Notification
                {
                    UserId = studentId,
                    Title = "New internship published",
                    Body = $"{entity.Title} is now open for applications.",
                    Type = Domain.Enums.NotificationType.System,
                    CreatedBy = currentUser.UserId
                };

                studentNotifications.Add(studentNotification);
                await unitOfWork.Repository<Notification>().AddAsync(studentNotification, cancellationToken);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:internships", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("internships", cancellationToken);

        foreach (var studentNotification in studentNotifications)
        {
            await notifications.DispatchAsync(new NotificationDto(
                studentNotification.Id,
                studentNotification.UserId,
                studentNotification.Title,
                studentNotification.Body,
                studentNotification.Type,
                studentNotification.IsRead,
                studentNotification.CreatedAt), cancellationToken);
        }

        if (entity.Status == InternshipStatus.Published && studentIds.Count > 0)
        {
            await notifications.DispatchInternshipPublishedAsync(studentIds, new
            {
                internshipId = entity.Id,
                title = entity.Title,
                companyId = entity.CompanyId,
                createdAt = DateTime.UtcNow
            }, cancellationToken);
        }

        return Result<InternshipDto>.Success(new InternshipDto(
            entity.Id, entity.Title, entity.Description, entity.Location, entity.Type, entity.Status,
            entity.MaxApplicants, entity.CurrentApplicants, entity.SalaryMin, entity.SalaryMax, entity.DeadlineAt,
            new CompanyDto(entity.CompanyId, string.Empty, null, null, null, false),
            string.Empty));
    }
}

public sealed class UpdateInternshipCapacityCommandHandler(
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUser,
    ICacheService cacheService,
    INotificationDispatcher notifications)
    : IRequestHandler<UpdateInternshipCapacityCommand, Result<InternshipDto>>
{
    public async Task<Result<InternshipDto>> Handle(UpdateInternshipCapacityCommand request, CancellationToken cancellationToken)
    {
        var internship = unitOfWork.Repository<Internship>().Query().FirstOrDefault(x => x.Id == request.InternshipId);
        if (internship is null)
            return Result<InternshipDto>.Failure("Internship was not found.");

        internship.MaxApplicants = request.Request.MaxApplicants;
        internship.UpdatedBy = currentUser.UserId;

        if (internship.CurrentApplicants >= internship.MaxApplicants)
        {
            internship.Status = InternshipStatus.Closed;
        }
        else if (internship.Status == InternshipStatus.Closed)
        {
            internship.Status = InternshipStatus.Published;
        }

        unitOfWork.Repository<Internship>().Update(internship);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:internships", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("internships", cancellationToken);

        return Result<InternshipDto>.Success(internship.ToDto(unitOfWork));
    }
}

public sealed class DeleteInternshipCommandHandler(IUnitOfWork unitOfWork, ICacheService cacheService, INotificationDispatcher notifications)
    : IRequestHandler<DeleteInternshipCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(DeleteInternshipCommand request, CancellationToken cancellationToken)
    {
        var internship = unitOfWork.Repository<Internship>().Query().FirstOrDefault(x => x.Id == request.InternshipId);
        if (internship is null)
            return Result<bool>.Failure("Internship was not found.");

        unitOfWork.Repository<Internship>().Remove(internship);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:internships", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("internships", cancellationToken);
        return Result<bool>.Success(true);
    }
}

internal static class InternshipMapping
{
    public static InternshipDto ToDto(this Internship x, IUnitOfWork unitOfWork)
    {
        var company = unitOfWork.Repository<Company>().Query().FirstOrDefault(c => c.Id == x.CompanyId);
        var category = unitOfWork.Repository<Category>().Query().FirstOrDefault(c => c.Id == x.CategoryId);

        return new InternshipDto(
            x.Id,
            x.Title,
            x.Description,
            x.Location,
            x.Type,
            x.Status,
            x.MaxApplicants,
            x.CurrentApplicants,
            x.SalaryMin,
            x.SalaryMax,
            x.DeadlineAt,
            new CompanyDto(company?.Id ?? x.CompanyId, company?.Name ?? string.Empty, company?.Description, company?.Website, company?.Location, company?.IsVerified ?? false),
            category?.Name ?? string.Empty);
    }
}

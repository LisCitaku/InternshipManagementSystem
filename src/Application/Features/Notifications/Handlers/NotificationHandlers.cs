using Application.Common;
using Application.DTOs;
using Application.Features.Notifications.Queries;
using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.Notifications.Handlers;

public sealed class GetNotificationsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetNotificationsQuery, Result<PagedResult<NotificationDto>>>
{
    public Task<Result<PagedResult<NotificationDto>>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Task.FromResult(Result<PagedResult<NotificationDto>>.Failure("Authentication is required."));

        var query = unitOfWork.Repository<Notification>().Query().Where(x => x.UserId == currentUser.UserId.Value);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Title.Contains(request.Search) || x.Body.Contains(request.Search));

        query = request.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt);
        var total = query.Count();
        var items = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(x => new NotificationDto(x.Id, x.UserId, x.Title, x.Body, x.Type, x.IsRead, x.CreatedAt)).ToList();

        return Task.FromResult(Result<PagedResult<NotificationDto>>.Success(new PagedResult<NotificationDto>(items, request.PageNumber, request.PageSize, total)));
    }
}

public sealed class MarkNotificationAsReadCommand : IRequest<Result<bool>>
{
    public Guid NotificationId { get; init; }
}

public sealed class MarkAllNotificationsAsReadCommand : IRequest<Result<bool>>;

public sealed class MarkNotificationAsReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<MarkNotificationAsReadCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<bool>.Failure("Authentication is required.");

        var notification = unitOfWork.Repository<Notification>().Query()
            .FirstOrDefault(x => x.Id == request.NotificationId && x.UserId == currentUser.UserId.Value);

        if (notification is null)
            return Result<bool>.Failure("Notification was not found.");

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        notification.UpdatedBy = currentUser.UserId;
        unitOfWork.Repository<Notification>().Update(notification);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}

public sealed class MarkAllNotificationsAsReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<MarkAllNotificationsAsReadCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(MarkAllNotificationsAsReadCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<bool>.Failure("Authentication is required.");

        var notifications = unitOfWork.Repository<Notification>().Query()
            .Where(x => x.UserId == currentUser.UserId.Value && !x.IsRead)
            .ToList();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedBy = currentUser.UserId;
            unitOfWork.Repository<Notification>().Update(notification);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

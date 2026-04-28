using Application.Common;
using Application.DTOs;
using MediatR;

namespace Application.Features.Notifications.Queries;

public sealed class GetNotificationsQuery : PagedQuery, IRequest<Result<PagedResult<NotificationDto>>>;


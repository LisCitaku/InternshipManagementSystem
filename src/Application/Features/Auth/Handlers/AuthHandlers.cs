using Application.Common;
using Application.DTOs;
using Application.Features.Auth.Commands;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Features.Auth.Handlers;

public sealed class RegisterCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService, INotificationDispatcher notifications)
    : IRequestHandler<RegisterCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var users = unitOfWork.Repository<User>();
        if (users.Query().Any(x => x.Email == request.Request.Email))
            return Result<AuthResponseDto>.Failure("Email is already registered.");

        var registrationType = request.Request.RegistrationType?.Trim();
        if (registrationType is not "Student" and not "Recruiter")
            return Result<AuthResponseDto>.Failure("RegistrationType must be Student or Recruiter.");

        var companyName = request.Request.CompanyName?.Trim();
        var companyWebsite = request.Request.CompanyWebsite?.Trim();

        if (registrationType == "Recruiter" && string.IsNullOrWhiteSpace(companyName))
            return Result<AuthResponseDto>.Failure("Company name is required for recruiter registration.");

        var user = new User
        {
            Email = request.Request.Email.Trim().ToLowerInvariant(),
            FirstName = request.Request.FirstName.Trim(),
            LastName = request.Request.LastName.Trim(),
            PhoneNumber = request.Request.PhoneNumber,
            PasswordHash = passwordHasher.Hash(request.Request.Password),
            IsActive = registrationType == "Student"
        };

        await users.AddAsync(user, cancellationToken);
        var roleName = registrationType == "Recruiter" ? "Recruiter" : "Student";
        var role = unitOfWork.Repository<Role>().Query().FirstOrDefault(x => x.Name == roleName);
        if (role is null)
        {
            role = new Role { Name = roleName, Description = $"{roleName} role" };
            await unitOfWork.Repository<Role>().AddAsync(role, cancellationToken);
        }

        if (registrationType == "Student")
        {
            user.UserRoles.Add(new UserRole { User = user, Role = role });
        }
        else
        {
            var approvalRequest = new RecruiterApprovalRequest
            {
                User = user,
                UserId = user.Id,
                CompanyName = companyName!,
                CompanyWebsite = companyWebsite,
                Status = "Pending"
            };

            await unitOfWork.Repository<RecruiterApprovalRequest>().AddAsync(approvalRequest, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (registrationType == "Recruiter")
        {
            var adminIds = unitOfWork.Repository<UserRole>().Query()
                .Where(x => x.Role.Name == "Admin")
                .Select(x => x.UserId)
                .Distinct()
                .ToList();

            await notifications.DispatchRecruiterRequestAsync(adminIds, new
            {
                userId = user.Id,
                fullName = $"{user.FirstName} {user.LastName}",
                email = user.Email,
                companyName,
                companyWebsite,
                createdAt = DateTime.UtcNow
            }, cancellationToken);

            return Result<AuthResponseDto>.Failure("Your recruiter request is pending admin approval.");
        }

        return Result<AuthResponseDto>.Success(await jwtTokenService.CreateTokenAsync(user, cancellationToken));
    }
}

public sealed class LoginCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService)
    : IRequestHandler<LoginCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var email = request.Request.Email.Trim().ToLowerInvariant();
        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Email == email);
        if (user is null || !passwordHasher.Verify(request.Request.Password, user.PasswordHash))
            return Result<AuthResponseDto>.Failure("Invalid email or password.");

        if (!user.IsActive)
        {
            var pendingRecruiter = unitOfWork.Repository<RecruiterApprovalRequest>().Query().FirstOrDefault(x => x.UserId == user.Id && x.Status == "Pending");
            if (pendingRecruiter is not null)
                return Result<AuthResponseDto>.Failure("Your recruiter request is pending admin approval.");

            return Result<AuthResponseDto>.Failure("Your account is inactive.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        unitOfWork.Repository<User>().Update(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<AuthResponseDto>.Success(await jwtTokenService.CreateTokenAsync(user, cancellationToken));
    }
}

public sealed class RefreshTokenCommandHandler(IUnitOfWork unitOfWork, IJwtTokenService jwtTokenService)
    : IRequestHandler<RefreshTokenCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = jwtTokenService.HashRefreshToken(request.Request.RefreshToken);
        var refreshToken = unitOfWork.Repository<RefreshToken>().Query().FirstOrDefault(x => x.TokenHash == tokenHash && x.RevokedAt == null);
        if (refreshToken is null || refreshToken.ExpiresAt <= DateTime.UtcNow)
            return Result<AuthResponseDto>.Failure("Refresh token is invalid or expired.");

        refreshToken.RevokedAt = DateTime.UtcNow;
        unitOfWork.Repository<RefreshToken>().Update(refreshToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var user = unitOfWork.Repository<User>().Query().First(x => x.Id == refreshToken.UserId);
        return Result<AuthResponseDto>.Success(await jwtTokenService.CreateTokenAsync(user, cancellationToken));
    }
}

public sealed class GetPendingRecruiterRequestsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetPendingRecruiterRequestsQuery, Result<IReadOnlyList<RecruiterApprovalRequestDto>>>
{
    public Task<Result<IReadOnlyList<RecruiterApprovalRequestDto>>> Handle(GetPendingRecruiterRequestsQuery request, CancellationToken cancellationToken)
    {
        var items = unitOfWork.Repository<RecruiterApprovalRequest>().Query()
            .Where(x => x.Status == "Pending")
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new RecruiterApprovalRequestDto(
                x.Id,
                x.UserId,
                x.User.FirstName + " " + x.User.LastName,
                x.User.Email,
                x.CompanyName,
                x.CompanyWebsite,
                x.Status,
                x.CreatedAt,
                x.ReviewedAt,
                x.ReviewedByAdminId))
            .ToList();

        return Task.FromResult(Result<IReadOnlyList<RecruiterApprovalRequestDto>>.Success(items));
    }
}

public sealed class ApproveRecruiterRequestCommandHandler(
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUser,
    INotificationDispatcher notifications)
    : IRequestHandler<ApproveRecruiterRequestCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ApproveRecruiterRequestCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<bool>.Failure("Authentication is required.");

        var adminRole = unitOfWork.Repository<UserRole>().Query().Any(x => x.UserId == currentUser.UserId.Value && x.Role.Name == "Admin");
        if (!adminRole)
            return Result<bool>.Failure("Only admins can approve recruiters.");

        var approvalRequest = unitOfWork.Repository<RecruiterApprovalRequest>().Query().FirstOrDefault(x => x.Id == request.RequestId);
        if (approvalRequest is null)
            return Result<bool>.Failure("Recruiter request was not found.");

        approvalRequest.Status = "Approved";
        approvalRequest.ReviewedAt = DateTime.UtcNow;
        approvalRequest.ReviewedByAdminId = currentUser.UserId;

        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Id == approvalRequest.UserId);
        if (user is null)
            return Result<bool>.Failure("User was not found.");

        user.IsActive = true;
        unitOfWork.Repository<User>().Update(user);
        unitOfWork.Repository<RecruiterApprovalRequest>().Update(approvalRequest);

        var recruiterRole = unitOfWork.Repository<Role>().Query().FirstOrDefault(x => x.Name == "Recruiter");
        if (recruiterRole is null)
        {
            recruiterRole = new Role { Name = "Recruiter", Description = "Recruiter role" };
            await unitOfWork.Repository<Role>().AddAsync(recruiterRole, cancellationToken);
        }

        var hasRole = unitOfWork.Repository<UserRole>().Query().Any(x => x.UserId == user.Id && x.RoleId == recruiterRole.Id);
        if (!hasRole)
        {
            await unitOfWork.Repository<UserRole>().AddAsync(new UserRole { UserId = user.Id, RoleId = recruiterRole.Id }, cancellationToken);
        }

        var notification = new Notification
        {
            UserId = user.Id,
            Title = "Recruiter request approved",
            Body = "Your recruiter account has been approved. You can now log in.",
            Type = NotificationType.System,
            CreatedBy = currentUser.UserId
        };
        await unitOfWork.Repository<Notification>().AddAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await notifications.DispatchAsync(new NotificationDto(notification.Id, notification.UserId, notification.Title, notification.Body, notification.Type, notification.IsRead, notification.CreatedAt), cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("users", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("roles", cancellationToken);

        return Result<bool>.Success(true);
    }
}

public sealed class RejectRecruiterRequestCommandHandler(
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUser,
    INotificationDispatcher notifications)
    : IRequestHandler<RejectRecruiterRequestCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(RejectRecruiterRequestCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.UserId is null)
            return Result<bool>.Failure("Authentication is required.");

        var adminRole = unitOfWork.Repository<UserRole>().Query().Any(x => x.UserId == currentUser.UserId.Value && x.Role.Name == "Admin");
        if (!adminRole)
            return Result<bool>.Failure("Only admins can reject recruiters.");

        var approvalRequest = unitOfWork.Repository<RecruiterApprovalRequest>().Query().FirstOrDefault(x => x.Id == request.RequestId);
        if (approvalRequest is null)
            return Result<bool>.Failure("Recruiter request was not found.");

        approvalRequest.Status = "Rejected";
        approvalRequest.ReviewedAt = DateTime.UtcNow;
        approvalRequest.ReviewedByAdminId = currentUser.UserId;

        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Id == approvalRequest.UserId);
        if (user is null)
            return Result<bool>.Failure("User was not found.");

        user.IsActive = false;
        unitOfWork.Repository<User>().Update(user);
        unitOfWork.Repository<RecruiterApprovalRequest>().Update(approvalRequest);

        var notification = new Notification
        {
            UserId = user.Id,
            Title = "Recruiter request rejected",
            Body = "Your recruiter request was rejected by admin.",
            Type = NotificationType.System,
            CreatedBy = currentUser.UserId
        };
        await unitOfWork.Repository<Notification>().AddAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await notifications.DispatchAsync(new NotificationDto(notification.Id, notification.UserId, notification.Title, notification.Body, notification.Type, notification.IsRead, notification.CreatedAt), cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("users", cancellationToken);
        await notifications.DispatchDashboardRefreshAsync("roles", cancellationToken);

        return Result<bool>.Success(true);
    }
}

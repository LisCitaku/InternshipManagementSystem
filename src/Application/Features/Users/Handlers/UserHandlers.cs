using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Features.Users.Handlers;

internal static class UserRoleMapper
{
    public static string NormalizeRoleName(string role) => role.Trim() switch
    {
        _ => role.Trim()
    };

    public static UserDto ToDto(User user, IReadOnlyList<string>? roles = null) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.PhoneNumber, user.IsActive, roles ?? user.UserRoles.Select(x => x.Role.Name).ToList());
}

public sealed class GetCurrentUserQueryHandler(ICurrentUserService currentUserService, IUnitOfWork unitOfWork) : IRequestHandler<GetCurrentUserQuery, Result<UserDto>>
{
    public Task<Result<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (!currentUserService.IsAuthenticated || !currentUserService.UserId.HasValue)
            return Task.FromResult(Result<UserDto>.Failure("User is not authenticated."));

        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Id == currentUserService.UserId.Value);
        if (user is null)
            return Task.FromResult(Result<UserDto>.Failure("User not found."));

        return Task.FromResult(Result<UserDto>.Success(UserRoleMapper.ToDto(user)));
    }
}

public sealed class GetCurrentUserProfileQueryHandler(ICurrentUserService currentUserService, IUnitOfWork unitOfWork)
    : IRequestHandler<GetCurrentUserProfileQuery, Result<CurrentUserProfileDto>>
{
    public Task<Result<CurrentUserProfileDto>> Handle(GetCurrentUserProfileQuery request, CancellationToken cancellationToken)
    {
        if (!currentUserService.IsAuthenticated || !currentUserService.UserId.HasValue)
            return Task.FromResult(Result<CurrentUserProfileDto>.Failure("User is not authenticated."));

        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Id == currentUserService.UserId.Value);
        if (user is null)
            return Task.FromResult(Result<CurrentUserProfileDto>.Failure("User not found."));

        var roles = user.UserRoles.Select(x => x.Role.Name).ToList();
        var settings = unitOfWork.Repository<Setting>().Query()
            .Where(x => x.Key.StartsWith($"profile:{user.Id}:"))
            .ToList()
            .ToDictionary(x => x.Key, x => x.Value);

        var profile = new CurrentUserProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            roles,
            settings.GetValueOrDefault($"profile:{user.Id}:university", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:field_of_study", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:headline", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:bio", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:avatar_url"),
            settings.GetValueOrDefault($"profile:{user.Id}:avatar_file_name"),
            settings.GetValueOrDefault($"profile:{user.Id}:cv_url"),
            settings.GetValueOrDefault($"profile:{user.Id}:cv_file_name"));

        return Task.FromResult(Result<CurrentUserProfileDto>.Success(profile));
    }
}

public sealed class GetUsersQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetUsersQuery, Result<PagedResult<UserDto>>>
{
    public Task<Result<PagedResult<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<User>().Query();
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Email.Contains(request.Search) || x.FirstName.Contains(request.Search) || x.LastName.Contains(request.Search));
        if (!string.IsNullOrWhiteSpace(request.Role) && request.Role != "all")
        {
            var normalizedRole = UserRoleMapper.NormalizeRoleName(request.Role);
            query = query.Where(x => x.UserRoles.Any(r => r.Role.Name == normalizedRole));
        }

        query = request.Descending ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt);
        var total = query.Count();
        var items = query.Skip((request.PageNumber - 1) * request.PageSize).Take(request.PageSize)
            .Select(x => new UserDto(x.Id, x.Email, x.FirstName, x.LastName, x.PhoneNumber, x.IsActive, x.UserRoles.Select(r => r.Role.Name).ToList()))
            .ToList();

        return Task.FromResult(Result<PagedResult<UserDto>>.Success(new PagedResult<UserDto>(items, request.PageNumber, request.PageSize, total)));
    }
}

public sealed class CreateUserCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    : IRequestHandler<CreateUserCommand, Result<UserDto>>
{
    public async Task<Result<UserDto>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var users = unitOfWork.Repository<User>();
        var email = request.Request.Email.Trim().ToLowerInvariant();
        if (users.Query().Any(x => x.Email == email))
            return Result<UserDto>.Failure("Email is already registered.");

        var roleName = UserRoleMapper.NormalizeRoleName(request.Request.Role);
        var role = unitOfWork.Repository<Role>().Query().FirstOrDefault(x => x.Name == roleName);
        if (role is null)
            return Result<UserDto>.Failure("Selected role does not exist.");

        var user = new User
        {
            Email = email,
            FirstName = request.Request.FirstName.Trim(),
            LastName = request.Request.LastName.Trim(),
            PhoneNumber = request.Request.PhoneNumber?.Trim(),
            PasswordHash = passwordHasher.Hash(request.Request.Password),
            IsActive = true
        };

        user.UserRoles.Add(new UserRole { User = user, Role = role });
        await users.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(UserRoleMapper.ToDto(user, [role.Name]));
    }
}

public sealed class UpdateUserRoleCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateUserRoleCommand, Result<UserDto>>
{
    public async Task<Result<UserDto>> Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
    {
        var users = unitOfWork.Repository<User>();
        var user = users.Query().FirstOrDefault(x => x.Id == request.UserId);
        if (user is null)
            return Result<UserDto>.Failure("User was not found.");

        var roleName = UserRoleMapper.NormalizeRoleName(request.Request.Role);
        var role = unitOfWork.Repository<Role>().Query().FirstOrDefault(x => x.Name == roleName);
        if (role is null)
            return Result<UserDto>.Failure("Selected role does not exist.");

        var userRolesRepository = unitOfWork.Repository<UserRole>();
        var existingRoles = userRolesRepository.Query().Where(x => x.UserId == user.Id).ToList();
        foreach (var existingRole in existingRoles)
            userRolesRepository.Remove(existingRole);

        await userRolesRepository.AddAsync(new UserRole { UserId = user.Id, RoleId = role.Id }, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(UserRoleMapper.ToDto(user, [role.Name]));
    }
}

public sealed class UpdateUserStatusCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateUserStatusCommand, Result<UserDto>>
{
    public async Task<Result<UserDto>> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var users = unitOfWork.Repository<User>();
        var trackedUser = users.Query().FirstOrDefault(x => x.Id == request.UserId);
        if (trackedUser is null)
            return Result<UserDto>.Failure("User was not found.");

        var pendingRecruiterRequest = unitOfWork.Repository<RecruiterApprovalRequest>().Query()
            .FirstOrDefault(x => x.UserId == trackedUser.Id && x.Status == "Pending");
        if (pendingRecruiterRequest is not null)
            return Result<UserDto>.Failure("Pending recruiters must be approved or rejected from the recruiter requests workflow.");

        trackedUser.IsActive = request.Request.IsActive;
        users.Update(trackedUser);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(UserRoleMapper.ToDto(
            trackedUser,
            unitOfWork.Repository<UserRole>().Query().Where(x => x.UserId == trackedUser.Id).Select(x => x.Role.Name).ToList()));
    }
}

public sealed class UpdateCurrentUserProfileCommandHandler(ICurrentUserService currentUserService, IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateCurrentUserProfileCommand, Result<CurrentUserProfileDto>>
{
    public async Task<Result<CurrentUserProfileDto>> Handle(UpdateCurrentUserProfileCommand request, CancellationToken cancellationToken)
    {
        if (!currentUserService.IsAuthenticated || !currentUserService.UserId.HasValue)
            return Result<CurrentUserProfileDto>.Failure("User is not authenticated.");

        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Id == currentUserService.UserId.Value);
        if (user is null)
            return Result<CurrentUserProfileDto>.Failure("User not found.");

        user.FirstName = request.Request.FirstName.Trim();
        user.LastName = request.Request.LastName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.Request.PhoneNumber) ? null : request.Request.PhoneNumber.Trim();
        unitOfWork.Repository<User>().Update(user);

        await UpsertSettingAsync(unitOfWork, user.Id, "university", request.Request.University.Trim(), cancellationToken);
        await UpsertSettingAsync(unitOfWork, user.Id, "field_of_study", request.Request.FieldOfStudy.Trim(), cancellationToken);
        await UpsertSettingAsync(unitOfWork, user.Id, "headline", request.Request.Headline.Trim(), cancellationToken);
        await UpsertSettingAsync(unitOfWork, user.Id, "bio", request.Request.Bio.Trim(), cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        var roles = unitOfWork.Repository<UserRole>().Query()
            .Where(x => x.UserId == user.Id)
            .Select(x => x.Role.Name)
            .ToList();

        var settings = unitOfWork.Repository<Setting>().Query()
            .Where(x => x.Key.StartsWith($"profile:{user.Id}:"))
            .ToList()
            .ToDictionary(x => x.Key, x => x.Value);

        var profile = new CurrentUserProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            roles,
            settings.GetValueOrDefault($"profile:{user.Id}:university", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:field_of_study", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:headline", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:bio", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:avatar_url"),
            settings.GetValueOrDefault($"profile:{user.Id}:avatar_file_name"),
            settings.GetValueOrDefault($"profile:{user.Id}:cv_url"),
            settings.GetValueOrDefault($"profile:{user.Id}:cv_file_name"));

        return Result<CurrentUserProfileDto>.Success(profile);
    }

    private static async Task UpsertSettingAsync(IUnitOfWork unitOfWork, Guid userId, string keySuffix, string value, CancellationToken cancellationToken)
    {
        var key = $"profile:{userId}:{keySuffix}";
        var settings = unitOfWork.Repository<Setting>();
        var existing = settings.Query().FirstOrDefault(x => x.Key == key);

        if (existing is null)
        {
            await settings.AddAsync(new Setting
            {
                Key = key,
                Value = value,
                CreatedBy = userId
            }, cancellationToken);
            return;
        }

        existing.Value = value;
        settings.Update(existing);
    }
}

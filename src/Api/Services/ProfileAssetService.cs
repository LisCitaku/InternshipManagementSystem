using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;

namespace Api.Services;

public sealed class ProfileAssetService(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IWebHostEnvironment environment) : IProfileAssetService
{
    public Task<CurrentUserProfileDto> GetCurrentProfileAsync(CancellationToken cancellationToken = default) =>
        LoadProfileAsync(cancellationToken);

    public async Task<CurrentUserProfileDto> UpdateCurrentProfileAsync(UpdateCurrentUserProfileRequestDto request, CancellationToken cancellationToken = default)
    {
        var profile = await RequireProfileUserAsync(cancellationToken);
        var user = profile.User;

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        unitOfWork.Repository<User>().Update(user);

        await UpsertSettingAsync(user.Id, "university", request.University.Trim(), cancellationToken);
        await UpsertSettingAsync(user.Id, "field_of_study", request.FieldOfStudy.Trim(), cancellationToken);
        await UpsertSettingAsync(user.Id, "headline", request.Headline.Trim(), cancellationToken);
        await UpsertSettingAsync(user.Id, "bio", request.Bio.Trim(), cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await LoadProfileAsync(cancellationToken);
    }

    public async Task<CurrentUserProfileDto> UploadAvatarAsync(ProfileFileUploadRequestDto request, CancellationToken cancellationToken = default)
    {
        var profile = await RequireProfileUserAsync(cancellationToken);
        var asset = await SaveProfileFileAsync(profile.User.Id, request, "avatar", cancellationToken);
        await UpsertSettingAsync(profile.User.Id, "avatar_url", asset.PublicUrl, cancellationToken);
        await UpsertSettingAsync(profile.User.Id, "avatar_file_name", asset.OriginalFileName, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await LoadProfileAsync(cancellationToken);
    }

    public async Task<CurrentUserProfileDto> UploadCvAsync(ProfileFileUploadRequestDto request, CancellationToken cancellationToken = default)
    {
        var profile = await RequireProfileUserAsync(cancellationToken);
        var asset = await SaveProfileFileAsync(profile.User.Id, request, "cv", cancellationToken);
        await UpsertSettingAsync(profile.User.Id, "cv_url", asset.PublicUrl, cancellationToken);
        await UpsertSettingAsync(profile.User.Id, "cv_file_name", asset.OriginalFileName, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await LoadProfileAsync(cancellationToken);
    }

    private async Task<(User User, IReadOnlyList<string> Roles)> RequireProfileUserAsync(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            throw new InvalidOperationException("User is not authenticated.");

        var user = unitOfWork.Repository<User>().Query().FirstOrDefault(x => x.Id == currentUser.UserId.Value);
        if (user is null)
            throw new InvalidOperationException("User not found.");

        var roles = unitOfWork.Repository<UserRole>().Query()
            .Where(x => x.UserId == user.Id)
            .Select(x => x.Role.Name)
            .ToList();

        return await Task.FromResult((user, (IReadOnlyList<string>)roles));
    }

    private async Task<CurrentUserProfileDto> LoadProfileAsync(CancellationToken cancellationToken)
    {
        var profileUser = await RequireProfileUserAsync(cancellationToken);
        var user = profileUser.User;
        var settings = unitOfWork.Repository<Setting>().Query()
            .Where(x => x.Key.StartsWith($"profile:{user.Id}:"))
            .ToList()
            .ToDictionary(x => x.Key, x => x.Value);

        return new CurrentUserProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            profileUser.Roles,
            settings.GetValueOrDefault($"profile:{user.Id}:university", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:field_of_study", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:headline", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:bio", string.Empty),
            settings.GetValueOrDefault($"profile:{user.Id}:avatar_url"),
            settings.GetValueOrDefault($"profile:{user.Id}:avatar_file_name"),
            settings.GetValueOrDefault($"profile:{user.Id}:cv_url"),
            settings.GetValueOrDefault($"profile:{user.Id}:cv_file_name"));
    }

    private async Task<ProfileFileAssetResult> SaveProfileFileAsync(Guid userId, ProfileFileUploadRequestDto request, string kind, CancellationToken cancellationToken)
    {
        var uploadRoot = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", "profile", userId.ToString("N"));
        Directory.CreateDirectory(uploadRoot);

        var extension = Path.GetExtension(request.FileName);
        var storedFileName = $"{kind}-{Guid.NewGuid():N}{extension}";
        var relativePath = Path.Combine("uploads", "profile", userId.ToString("N"), storedFileName).Replace('\\', '/');
        var absolutePath = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), relativePath);

        await File.WriteAllBytesAsync(absolutePath, request.Content, cancellationToken);

        var fileAsset = new FileAsset
        {
            UploadedByUserId = userId,
            FileName = request.FileName,
            StoredFileName = storedFileName,
            ContentType = request.ContentType,
            SizeInBytes = request.Content.LongLength,
            StoragePath = relativePath,
            CreatedBy = userId
        };

        await unitOfWork.Repository<FileAsset>().AddAsync(fileAsset, cancellationToken);

        return new ProfileFileAssetResult($"/{relativePath}", request.FileName);
    }

    private async Task UpsertSettingAsync(Guid userId, string keySuffix, string value, CancellationToken cancellationToken)
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

    private sealed record ProfileFileAssetResult(string PublicUrl, string OriginalFileName);
}

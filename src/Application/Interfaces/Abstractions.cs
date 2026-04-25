using System.Linq.Expressions;
using Application.Common;
using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    IQueryable<T> Query();
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUnitOfWork
{
    IRepository<T> Repository<T>() where T : BaseEntity;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

public interface IJwtTokenService
{
    Task<AuthResponseDto> CreateTokenAsync(User user, CancellationToken cancellationToken = default);
    string HashRefreshToken(string refreshToken);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}

public interface INotificationDispatcher
{
    Task DispatchAsync(NotificationDto notification, CancellationToken cancellationToken = default);
    Task DispatchMessageAsync(MessageDto message, CancellationToken cancellationToken = default);
    Task DispatchDashboardRefreshAsync(string? scope = null, CancellationToken cancellationToken = default);
    Task DispatchChatRefreshAsync(Guid senderUserId, Guid recipientUserId, Guid conversationId, CancellationToken cancellationToken = default);
    Task DispatchApplicationAlertAsync(IEnumerable<Guid> userIds, object payload, CancellationToken cancellationToken = default);
    Task DispatchInternshipPublishedAsync(IEnumerable<Guid> userIds, object payload, CancellationToken cancellationToken = default);
    Task DispatchRecruiterRequestAsync(IEnumerable<Guid> adminUserIds, object payload, CancellationToken cancellationToken = default);
}

public interface IExportService
{
    Task<(byte[] Content, string ContentType, string FileName)> ExportAsync(ExportRequestDto request, CancellationToken cancellationToken = default);
}

public interface IImportService
{
    Task<ImportResultDto> ImportAsync(ImportRequestDto request, Stream content, CancellationToken cancellationToken = default);
}

public interface IReportService
{
    Task<ReportDto> GenerateAsync(ReportRequestDto request, CancellationToken cancellationToken = default);
}

public interface ICmsService
{
    Task<CmsPageDto> GetPageAsync(string pageKey, CancellationToken cancellationToken = default);
    Task<CmsPageDto> UpsertPageAsync(string pageKey, CmsPageUpdateRequestDto request, CancellationToken cancellationToken = default);
}

public interface IProfileAssetService
{
    Task<CurrentUserProfileDto> GetCurrentProfileAsync(CancellationToken cancellationToken = default);
    Task<CurrentUserProfileDto> UpdateCurrentProfileAsync(UpdateCurrentUserProfileRequestDto request, CancellationToken cancellationToken = default);
    Task<CurrentUserProfileDto> UploadAvatarAsync(ProfileFileUploadRequestDto request, CancellationToken cancellationToken = default);
    Task<CurrentUserProfileDto> UploadCvAsync(ProfileFileUploadRequestDto request, CancellationToken cancellationToken = default);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}

using Domain.Enums;

namespace Application.DTOs;

public sealed record AuthResponseDto(string AccessToken, string RefreshToken, DateTime ExpiresAt, UserDto User);
public sealed record LoginRequestDto(string Email, string Password);
public sealed record RegisterRequestDto(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string RegistrationType,
    string? CompanyName,
    string? CompanyWebsite);
public sealed record RefreshTokenRequestDto(string RefreshToken);
public sealed record UserDto(Guid Id, string Email, string FirstName, string LastName, string? PhoneNumber, bool IsActive, IReadOnlyList<string> Roles);
public sealed record CurrentUserProfileDto(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    IReadOnlyList<string> Roles,
    string University,
    string FieldOfStudy,
    string Headline,
    string Bio,
    string? AvatarUrl,
    string? AvatarFileName,
    string? CvUrl,
    string? CvFileName);
public sealed record UpdateCurrentUserProfileRequestDto(
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string University,
    string FieldOfStudy,
    string Headline,
    string Bio);
public sealed record ProfileFileUploadRequestDto(byte[] Content, string FileName, string ContentType);
public sealed record CreateUserRequestDto(string Email, string Password, string FirstName, string LastName, string? PhoneNumber, string Role);
public sealed record UpdateUserRoleRequestDto(string Role);
public sealed record UpdateUserStatusRequestDto(bool IsActive);

public sealed record CompanyDto(Guid Id, string Name, string? Description, string? Website, string? Location, bool IsVerified);
public sealed record CreateCompanyRequestDto(string Name, string? Website, string? Location, string? Description);
public sealed record UpdateCompanyRequestDto(string Name, string? Website, string? Location, string? Description);
public sealed record CategoryDto(Guid Id, string Name, string? Description);

public sealed record InternshipDto(
    Guid Id,
    string Title,
    string Description,
    string Location,
    InternshipType Type,
    InternshipStatus Status,
    int MaxApplicants,
    int CurrentApplicants,
    decimal? SalaryMin,
    decimal? SalaryMax,
    DateTime? DeadlineAt,
    CompanyDto Company,
    string Category);

public sealed record CreateInternshipRequestDto(
    Guid CompanyId,
    Guid CategoryId,
    string Title,
    string Description,
    string Location,
    InternshipType Type,
    int MaxApplicants,
    decimal? SalaryMin,
    decimal? SalaryMax,
    DateTime? DeadlineAt,
    bool PublishNow);

public sealed record UpdateInternshipCapacityRequestDto(int MaxApplicants);

public sealed record ApplicationDto(
    Guid Id,
    Guid InternshipId,
    string InternshipTitle,
    Guid ApplicantUserId,
    string ApplicantName,
    string Status,
    DateTime CreatedAt,
    string? CoverLetter,
    string? ResumeUrl);
public sealed record CreateApplicationRequestDto(
    Guid InternshipId,
    string? CoverLetter,
    string? ResumeUrl,
    string? PhoneNumber,
    string? University,
    string? FieldOfStudy,
    string? PortfolioUrl,
    string? GithubUrl);
public sealed record UpdateApplicationStatusRequestDto(string Status);

public sealed record NotificationDto(Guid Id, Guid UserId, string Title, string Body, NotificationType Type, bool IsRead, DateTime CreatedAt);

public sealed record MessageDto(Guid Id, Guid ConversationId, Guid SenderUserId, Guid RecipientUserId, string Body, DateTime CreatedAt, DateTime? ReadAt);
public sealed record SendMessageRequestDto(Guid ConversationId, Guid RecipientUserId, string Body);
public sealed record ConversationSummaryDto(Guid ConversationId, Guid RecipientUserId, string RecipientName, string RecipientRole, string? Subject, string? LastMessageBody, DateTime? LastMessageAt, int UnreadCount);
public sealed record ChatContactDto(Guid UserId, string FullName, string Role);
public sealed record CreateConversationRequestDto(Guid RecipientUserId, string? Subject);

public sealed record ReportRequestDto(string Name, ReportType Type, Dictionary<string, string>? Parameters);
public sealed record ReportDto(Guid Id, string Name, ReportType Type, string ResultJson, DateTime CreatedAt);
public sealed record ExportRequestDto(string Entity, string Format, Dictionary<string, string>? Filters);
public sealed record ImportRequestDto(string Entity, string Format);
public sealed record ImportResultDto(string Entity, int TotalRows, int UpsertedRows, int FailedRows, IReadOnlyList<string> Messages);

public sealed record CmsPageDto(string PageKey, string Title, string Description, Dictionary<string, string> Fields, DateTime UpdatedAt);
public sealed record CmsPageUpdateRequestDto(string Title, string Description, Dictionary<string, string> Fields);
public sealed record DashboardMetricDto(string Label, string Value, string Delta, string Tone);
public sealed record DashboardPointDto(string Label, int Value);
public sealed record DashboardSummaryDto(
    IReadOnlyList<DashboardMetricDto> Metrics,
    IReadOnlyList<DashboardPointDto> Timeline,
    IReadOnlyList<DashboardPointDto> Breakdown);

public sealed record RecruiterApprovalRequestDto(
    Guid Id,
    Guid UserId,
    string UserName,
    string Email,
    string CompanyName,
    string? CompanyWebsite,
    string Status,
    DateTime CreatedAt,
    DateTime? ReviewedAt,
    Guid? ReviewedByAdminId);

public sealed record ApproveRecruiterRequestDto();
public sealed record RejectRecruiterRequestDto();

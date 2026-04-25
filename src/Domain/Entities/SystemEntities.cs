using Domain.Enums;

namespace Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<UserSkill> UserSkills { get; set; } = [];
}

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

public class Permission : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}

public class RolePermission : BaseEntity
{
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;
}

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? ChangesJson { get; set; }
    public string? IpAddress { get; set; }
}

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class Setting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Group { get; set; }
    public bool IsEncrypted { get; set; }
}

public class FileAsset : BaseEntity
{
    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
}


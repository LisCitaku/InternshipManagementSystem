using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<FileAsset> Files => Set<FileAsset>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyUser> CompanyUsers => Set<CompanyUser>();
    public DbSet<Internship> Internships => Set<Internship>();
    public DbSet<JobApplication> Applications => Set<JobApplication>();
    public DbSet<ApplicationStatus> ApplicationStatuses => Set<ApplicationStatus>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<UserSkill> UserSkills => Set<UserSkill>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SavedJob> SavedJobs => Set<SavedJob>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<InterviewSchedule> InterviewSchedules => Set<InterviewSchedule>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<InternshipTag> InternshipTags => Set<InternshipTag>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<RecruiterApprovalRequest> RecruiterApprovalRequests => Set<RecruiterApprovalRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FileAsset>().ToTable("Files");
        modelBuilder.Entity<JobApplication>().ToTable("Applications");
        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Role>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Permission>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<Setting>().HasIndex(x => x.Key).IsUnique();
        modelBuilder.Entity<Company>().HasIndex(x => x.Name);
        modelBuilder.Entity<Internship>().HasIndex(x => new { x.Status, x.Location, x.Type });
        modelBuilder.Entity<Internship>().HasIndex(x => x.Title);
        modelBuilder.Entity<JobApplication>().HasIndex(x => new { x.InternshipId, x.ApplicantUserId }).IsUnique();
        modelBuilder.Entity<Notification>().HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
        modelBuilder.Entity<Message>().HasIndex(x => new { x.ConversationId, x.CreatedAt });
        modelBuilder.Entity<RefreshToken>().HasIndex(x => x.TokenHash).IsUnique();
        modelBuilder.Entity<Message>()
            .HasOne(x => x.SenderUser)
            .WithMany()
            .HasForeignKey(x => x.SenderUserId)
            .OnDelete(DeleteBehavior.NoAction);
        modelBuilder.Entity<Message>()
            .HasOne(x => x.RecipientUser)
            .WithMany()
            .HasForeignKey(x => x.RecipientUserId)
            .OnDelete(DeleteBehavior.NoAction);

        ConfigureJoin<UserRole>(modelBuilder, x => new { x.UserId, x.RoleId });
        ConfigureJoin<RolePermission>(modelBuilder, x => new { x.RoleId, x.PermissionId });
        ConfigureJoin<CompanyUser>(modelBuilder, x => new { x.CompanyId, x.UserId });
        ConfigureJoin<UserSkill>(modelBuilder, x => new { x.UserId, x.SkillId });
        ConfigureJoin<SavedJob>(modelBuilder, x => new { x.UserId, x.InternshipId });
        ConfigureJoin<InternshipTag>(modelBuilder, x => new { x.InternshipId, x.TagId });

        modelBuilder.Entity<Review>().Property(x => x.Rating).HasPrecision(2, 0);
        modelBuilder.Entity<Internship>().Property(x => x.SalaryMin).HasPrecision(18, 2);
        modelBuilder.Entity<Internship>().Property(x => x.SalaryMax).HasPrecision(18, 2);
        modelBuilder.Entity<Category>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Skill>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Tag>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<ApplicationStatus>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<RecruiterApprovalRequest>().Property(x => x.CompanyName).HasMaxLength(200);
        modelBuilder.Entity<RecruiterApprovalRequest>().Property(x => x.CompanyWebsite).HasMaxLength(300);
        modelBuilder.Entity<RecruiterApprovalRequest>().Property(x => x.Status).HasMaxLength(50);
        modelBuilder.Entity<RecruiterApprovalRequest>().HasIndex(x => new { x.Status, x.UserId });
        modelBuilder.Entity<RecruiterApprovalRequest>().HasIndex(x => x.UserId);
        modelBuilder.Entity<RecruiterApprovalRequest>().HasIndex(x => x.CompanyName);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType).Property(nameof(BaseEntity.CreatedAt)).HasColumnName("created_at");
                modelBuilder.Entity(entityType.ClrType).Property(nameof(BaseEntity.UpdatedAt)).HasColumnName("updated_at");
                modelBuilder.Entity(entityType.ClrType).Property(nameof(BaseEntity.CreatedBy)).HasColumnName("created_by");
                modelBuilder.Entity(entityType.ClrType).Property(nameof(BaseEntity.UpdatedBy)).HasColumnName("updated_by");
            }
        }

        Seed(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    private static void ConfigureJoin<TEntity>(ModelBuilder modelBuilder, System.Linq.Expressions.Expression<Func<TEntity, object?>> index)
        where TEntity : BaseEntity => modelBuilder.Entity<TEntity>().HasIndex(index).IsUnique();

    private static void Seed(ModelBuilder modelBuilder)
    {
        var seededAt = new DateTime(2026, 5, 7, 0, 0, 0, DateTimeKind.Utc);
        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var companyRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var studentRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = adminRoleId, Name = "Admin", Description = "Platform administrator", CreatedAt = seededAt },
            new Role { Id = companyRoleId, Name = "Company", Description = "Company recruiter", CreatedAt = seededAt },
            new Role { Id = studentRoleId, Name = "Student", Description = "Student applicant", CreatedAt = seededAt });

        modelBuilder.Entity<ApplicationStatus>().HasData(
            new ApplicationStatus { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"), Name = "Submitted", SortOrder = 1, CreatedAt = seededAt },
            new ApplicationStatus { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"), Name = "In Review", SortOrder = 2, CreatedAt = seededAt },
            new ApplicationStatus { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"), Name = "Interview", SortOrder = 3, CreatedAt = seededAt },
            new ApplicationStatus { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"), Name = "Accepted", SortOrder = 4, CreatedAt = seededAt },
            new ApplicationStatus { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5"), Name = "Rejected", SortOrder = 5, CreatedAt = seededAt });

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"), Name = "Software Engineering", CreatedAt = seededAt },
            new Category { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2"), Name = "Data Analytics", CreatedAt = seededAt },
            new Category { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3"), Name = "Marketing", CreatedAt = seededAt });

        modelBuilder.Entity<Company>().HasData(
            new Company
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-ccccccccccc1"),
                Name = "Northstar Labs",
                Description = "AI and cloud product studio",
                Website = "https://northstar.dev",
                Location = "Tirane",
                IsVerified = true,
                CreatedAt = seededAt
            },
            new Company
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-ccccccccccc2"),
                Name = "Civic Stack",
                Description = "Govtech and digital services partner",
                Website = "https://civicstack.io",
                Location = "Prishtine",
                IsVerified = true,
                CreatedAt = seededAt
            });
    }
}

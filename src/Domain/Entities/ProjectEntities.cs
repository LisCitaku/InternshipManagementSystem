using Domain.Enums;

namespace Domain.Entities;

public class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? Location { get; set; }
    public bool IsVerified { get; set; }
    public ICollection<CompanyUser> CompanyUsers { get; set; } = [];
    public ICollection<Internship> Internships { get; set; } = [];
}

public class CompanyUser : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Position { get; set; } = string.Empty;
}

public class Internship : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public InternshipType Type { get; set; }
    public InternshipStatus Status { get; set; } = InternshipStatus.Draft;
    public int MaxApplicants { get; set; } = 1;
    public int CurrentApplicants { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public DateTime? DeadlineAt { get; set; }
    public ICollection<JobApplication> Applications { get; set; } = [];
    public ICollection<InternshipTag> InternshipTags { get; set; } = [];
}

public class JobApplication : BaseEntity
{
    public Guid InternshipId { get; set; }
    public Internship Internship { get; set; } = null!;
    public Guid ApplicantUserId { get; set; }
    public User ApplicantUser { get; set; } = null!;
    public Guid StatusId { get; set; }
    public ApplicationStatus Status { get; set; } = null!;
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
}

public class ApplicationStatus : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class Skill : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ICollection<UserSkill> UserSkills { get; set; } = [];
}

public class UserSkill : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid SkillId { get; set; }
    public Skill Skill { get; set; } = null!;
    public int YearsOfExperience { get; set; }
}

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class SavedJob : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid InternshipId { get; set; }
    public Internship Internship { get; set; } = null!;
}

public class Conversation : BaseEntity
{
    public string? Subject { get; set; }
    public Guid? InternshipId { get; set; }
    public Internship? Internship { get; set; }
    public ICollection<Message> Messages { get; set; } = [];
}

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    public Guid SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;
    public Guid RecipientUserId { get; set; }
    public User RecipientUser { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
    public DateTime? ReadAt { get; set; }
}

public class Review : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid ReviewerUserId { get; set; }
    public User ReviewerUser { get; set; } = null!;
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class Interview : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public JobApplication Application { get; set; } = null!;
    public InterviewStatus Status { get; set; }
    public string? Notes { get; set; }
    public ICollection<InterviewSchedule> Schedules { get; set; } = [];
}

public class InterviewSchedule : BaseEntity
{
    public Guid InterviewId { get; set; }
    public Interview Interview { get; set; } = null!;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string? MeetingUrl { get; set; }
}

public class Tag : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ICollection<InternshipTag> InternshipTags { get; set; } = [];
}

public class InternshipTag : BaseEntity
{
    public Guid InternshipId { get; set; }
    public Internship Internship { get; set; } = null!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}

public class Report : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ReportType Type { get; set; }
    public string ParametersJson { get; set; } = "{}";
    public string ResultJson { get; set; } = "{}";
}

public class ActivityLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
}

public class RecruiterApprovalRequest : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyWebsite { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByAdminId { get; set; }
    public User? ReviewedByAdmin { get; set; }
}

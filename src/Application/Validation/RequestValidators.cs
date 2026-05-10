using Application.DTOs;
using FluentValidation;

namespace Application.Validation;

public sealed class RegisterRequestDtoValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RegistrationType).NotEmpty().Must(type => type is not null && type.Trim() is "Student" or "Recruiter")
            .WithMessage("RegistrationType must be Student or Recruiter.");
        RuleFor(x => x.CompanyName)
            .NotEmpty().When(x => string.Equals(x.RegistrationType?.Trim(), "Recruiter", StringComparison.Ordinal))
            .MaximumLength(200);
        RuleFor(x => x.CompanyWebsite).MaximumLength(300);
    }
}

public sealed class LoginRequestDtoValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class CreateUserRequestDtoValidator : AbstractValidator<CreateUserRequestDto>
{
    public CreateUserRequestDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Role).NotEmpty().Must(role =>
        {
            var normalized = role.Trim();
            return normalized is "Admin" or "Student" or "Company" or "Recruiter";
        }).WithMessage("Role must be Admin, Student, or Recruiter.");
    }
}

public sealed class UpdateUserRoleRequestDtoValidator : AbstractValidator<UpdateUserRoleRequestDto>
{
    public UpdateUserRoleRequestDtoValidator()
    {
        RuleFor(x => x.Role).NotEmpty().Must(role =>
        {
            var normalized = role.Trim();
            return normalized is "Admin" or "Student" or "Company" or "Recruiter";
        }).WithMessage("Role must be Admin, Student, or Recruiter.");
    }
}

public sealed class CreateInternshipRequestDtoValidator : AbstractValidator<CreateInternshipRequestDto>
{
    public CreateInternshipRequestDtoValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Location).NotEmpty().MaximumLength(200);
        RuleFor(x => x.MaxApplicants).GreaterThan(0);
        RuleFor(x => x.SalaryMax).GreaterThanOrEqualTo(x => x.SalaryMin).When(x => x.SalaryMin.HasValue && x.SalaryMax.HasValue);
    }
}

public sealed class UpdateInternshipCapacityRequestDtoValidator : AbstractValidator<UpdateInternshipCapacityRequestDto>
{
    public UpdateInternshipCapacityRequestDtoValidator()
    {
        RuleFor(x => x.MaxApplicants).GreaterThan(0);
    }
}

public sealed class CreateApplicationRequestDtoValidator : AbstractValidator<CreateApplicationRequestDto>
{
    public CreateApplicationRequestDtoValidator()
    {
        RuleFor(x => x.InternshipId).NotEmpty();
        RuleFor(x => x.CoverLetter).MaximumLength(4000);
    }
}

public sealed class UpdateApplicationStatusRequestDtoValidator : AbstractValidator<UpdateApplicationStatusRequestDto>
{
    public UpdateApplicationStatusRequestDtoValidator()
    {
        RuleFor(x => x.Status).NotEmpty().Must(status =>
            status.Trim() is "Submitted" or "In Review" or "Interview" or "Accepted" or "Rejected")
            .WithMessage("Status must be Submitted, In Review, Interview, Accepted, or Rejected.");
    }
}

public sealed class SendMessageRequestDtoValidator : AbstractValidator<SendMessageRequestDto>
{
    public SendMessageRequestDtoValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
        RuleFor(x => x.RecipientUserId).NotEmpty();
        RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
    }
}

public sealed class CreateConversationRequestDtoValidator : AbstractValidator<CreateConversationRequestDto>
{
    public CreateConversationRequestDtoValidator()
    {
        RuleFor(x => x.RecipientUserId).NotEmpty();
        RuleFor(x => x.Subject).MaximumLength(200);
    }
}

public sealed class UpdateCurrentUserProfileRequestDtoValidator : AbstractValidator<UpdateCurrentUserProfileRequestDto>
{
    public UpdateCurrentUserProfileRequestDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(50);
        RuleFor(x => x.University).NotEmpty().MaximumLength(200);
        RuleFor(x => x.FieldOfStudy).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Headline).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Bio).NotEmpty().MaximumLength(2000);
    }
}

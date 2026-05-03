using System.Globalization;
using System.Text;
using System.Text.Json;
using Application.DTOs;
using Application.Interfaces;
using ClosedXML.Excel;
using Domain.Entities;
using Domain.Enums;
using StackExchange.Redis;

namespace Infrastructure.Services;

public sealed class RedisCacheService(IConnectionMultiplexer? connectionMultiplexer) : ICacheService
{
    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (connectionMultiplexer is null)
            return default;

        var database = connectionMultiplexer.GetDatabase();
        var value = await database.StringGetAsync(key);
        if (!value.HasValue)
            return default;

        return JsonSerializer.Deserialize<T>(value.ToString());
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        if (connectionMultiplexer is null)
            return;

        var database = connectionMultiplexer.GetDatabase();
        await database.StringSetAsync(key, JsonSerializer.Serialize(value), ttl);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (connectionMultiplexer is null)
            return;

        await connectionMultiplexer.GetDatabase().KeyDeleteAsync(key);
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        if (connectionMultiplexer is null)
            return;

        var database = connectionMultiplexer.GetDatabase();
        foreach (var endpoint in connectionMultiplexer.GetEndPoints())
        {
            var server = connectionMultiplexer.GetServer(endpoint);
            foreach (var key in server.Keys(database: database.Database, pattern: $"{prefix}*"))
            {
                await database.KeyDeleteAsync(key);
            }
        }
    }
}

public sealed class CmsService(IUnitOfWork unitOfWork, ICacheService cacheService) : ICmsService
{
    private static readonly IReadOnlyDictionary<string, CmsDefaults> Defaults = new Dictionary<string, CmsDefaults>(StringComparer.OrdinalIgnoreCase)
    {
        ["landing"] = new CmsDefaults(
            "Landing Page",
            "Public homepage content for the platform",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["hero_title"] = "One control room for applications, hiring, and career visibility.",
                ["hero_description"] = "Built for university teams that need a clean workflow from discovery to offer.",
                ["primary_cta"] = "Open dashboard",
                ["secondary_cta"] = "See platform overview",
                ["feature_1_title"] = "Internships",
                ["feature_1_body"] = "Advanced search, saved jobs, and recruiter-managed listings.",
                ["feature_2_title"] = "Realtime chat",
                ["feature_2_body"] = "SignalR-powered chat and notifications across roles.",
                ["feature_3_title"] = "Analytics",
                ["feature_3_body"] = "Application funnels, internship metrics, and exports.",
                ["feature_4_title"] = "Access control",
                ["feature_4_body"] = "JWT auth, refresh tokens, and role-protected routes."
            }),
        ["about"] = new CmsDefaults(
            "About Page",
            "Static about page copy",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["headline"] = "Designed for a real internship workflow",
                ["body"] = "The platform connects students, companies, and administrators in one auditable workspace.",
                ["mission"] = "Reduce friction between opportunity discovery and application review.",
                ["vision"] = "Provide a clean academic-to-industry bridge with strong security and live collaboration."
            })
    };

    public async Task<CmsPageDto> GetPageAsync(string pageKey, CancellationToken cancellationToken = default)
    {
        var normalized = NormalizePageKey(pageKey);
        var cacheKey = $"cms:page:{normalized}";
        var cached = await cacheService.GetAsync<CmsPageDto>(cacheKey, cancellationToken);
        if (cached is not null)
            return cached;

        var defaults = GetDefaults(normalized);
        var settings = unitOfWork.Repository<Setting>().Query().ToList()
            .Where(x => x.Key.StartsWith($"cms:{normalized}:", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var title = settings.FirstOrDefault(x => x.Key.EndsWith(":meta:title", StringComparison.OrdinalIgnoreCase))?.Value ?? defaults.Title;
        var description = settings.FirstOrDefault(x => x.Key.EndsWith(":meta:description", StringComparison.OrdinalIgnoreCase))?.Value ?? defaults.Description;
        var fields = new Dictionary<string, string>(defaults.Fields, StringComparer.OrdinalIgnoreCase);

        foreach (var setting in settings.Where(x => x.Key.Contains(":field:", StringComparison.OrdinalIgnoreCase)))
        {
            var fieldKey = setting.Key.Split(':', StringSplitOptions.RemoveEmptyEntries).Last();
            fields[fieldKey] = setting.Value;
        }

        var updatedAt = settings.Count == 0 ? DateTime.UtcNow : settings.Max(x => x.UpdatedAt ?? x.CreatedAt);
        var dto = new CmsPageDto(normalized, title, description, fields, updatedAt);
        await cacheService.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(5), cancellationToken);
        return dto;
    }

    public async Task<CmsPageDto> UpsertPageAsync(string pageKey, CmsPageUpdateRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalized = NormalizePageKey(pageKey);
        var settingsRepository = unitOfWork.Repository<Setting>();

        await UpsertSettingAsync(settingsRepository, $"cms:{normalized}:meta:title", request.Title.Trim(), cancellationToken);
        await UpsertSettingAsync(settingsRepository, $"cms:{normalized}:meta:description", request.Description.Trim(), cancellationToken);

        foreach (var field in request.Fields)
        {
            await UpsertSettingAsync(settingsRepository, $"cms:{normalized}:field:{NormalizeFieldKey(field.Key)}", field.Value.Trim(), cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveByPrefixAsync($"cms:page:{normalized}", cancellationToken);
        return await GetPageAsync(normalized, cancellationToken);
    }

    private async Task UpsertSettingAsync(IRepository<Setting> repository, string key, string value, CancellationToken cancellationToken)
    {
        var existing = repository.Query().FirstOrDefault(x => x.Key == key);
        if (existing is null)
        {
            await repository.AddAsync(new Setting
            {
                Key = key,
                Value = value,
                Group = "cms",
                CreatedBy = null
            }, cancellationToken);
            return;
        }

        existing.Value = value;
        existing.Group = "cms";
        repository.Update(existing);
    }

    private static string NormalizePageKey(string pageKey) => string.IsNullOrWhiteSpace(pageKey) ? "landing" : pageKey.Trim().ToLowerInvariant();
    private static string NormalizeFieldKey(string fieldKey) => fieldKey.Trim().ToLowerInvariant().Replace(' ', '_').Replace('-', '_');

    private static CmsDefaults GetDefaults(string pageKey) => Defaults.TryGetValue(pageKey, out var defaults) ? defaults : Defaults["landing"];

    private sealed record CmsDefaults(string Title, string Description, Dictionary<string, string> Fields);
}

public sealed class ImportService(IUnitOfWork unitOfWork, ICacheService cacheService) : IImportService
{
    public async Task<ImportResultDto> ImportAsync(ImportRequestDto request, Stream content, CancellationToken cancellationToken = default)
    {
        var rows = ReadRows(request.Format, content);
        var messages = new List<string>();
        var upsertedRows = 0;
        var failedRows = 0;

        foreach (var row in rows)
        {
            try
            {
                var imported = request.Entity.ToLowerInvariant() switch
                {
                    "categories" => await UpsertCategoryAsync(row, cancellationToken),
                    "companies" => await UpsertCompanyAsync(row, cancellationToken),
                    "internships" => await UpsertInternshipAsync(row, cancellationToken),
                    "applications" => await UpsertApplicationAsync(row, cancellationToken),
                    "settings" => await UpsertSettingAsync(row, cancellationToken),
                    _ => throw new InvalidOperationException("Unsupported import entity.")
                };

                if (imported)
                    upsertedRows++;
                else
                    failedRows++;
            }
            catch (Exception ex)
            {
                failedRows++;
                messages.Add(ex.Message);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await InvalidateCachesAsync(request.Entity, cancellationToken);
        return new ImportResultDto(request.Entity, rows.Count, upsertedRows, failedRows, messages);
    }

    private async Task<bool> UpsertCategoryAsync(IReadOnlyDictionary<string, string> row, CancellationToken cancellationToken)
    {
        var name = GetValue(row, "name");
        if (string.IsNullOrWhiteSpace(name))
            return false;

        var repository = unitOfWork.Repository<Category>();
        var entity = repository.Query().FirstOrDefault(x => x.Name == name.Trim());
        if (entity is null)
        {
            await repository.AddAsync(new Category
            {
                Name = name.Trim(),
                Description = GetValue(row, "description")
            }, cancellationToken);
            return true;
        }

        entity.Description = GetValue(row, "description");
        repository.Update(entity);
        return true;
    }

    private async Task<bool> UpsertCompanyAsync(IReadOnlyDictionary<string, string> row, CancellationToken cancellationToken)
    {
        var name = GetValue(row, "name");
        if (string.IsNullOrWhiteSpace(name))
            return false;

        var repository = unitOfWork.Repository<Company>();
        var entity = repository.Query().FirstOrDefault(x => x.Name == name.Trim());
        if (entity is null)
        {
            await repository.AddAsync(new Company
            {
                Name = name.Trim(),
                Description = GetValue(row, "description"),
                Website = GetValue(row, "website"),
                Location = GetValue(row, "location"),
                IsVerified = ParseBool(GetValue(row, "is_verified", "verified"))
            }, cancellationToken);
            return true;
        }

        entity.Description = GetValue(row, "description");
        entity.Website = GetValue(row, "website");
        entity.Location = GetValue(row, "location");
        entity.IsVerified = ParseBool(GetValue(row, "is_verified", "verified"));
        repository.Update(entity);
        return true;
    }

    private async Task<bool> UpsertInternshipAsync(IReadOnlyDictionary<string, string> row, CancellationToken cancellationToken)
    {
        var title = GetValue(row, "title");
        var companyName = GetValue(row, "company", "company_name");
        var categoryName = GetValue(row, "category", "category_name");

        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(companyName) || string.IsNullOrWhiteSpace(categoryName))
            return false;

        var company = await EnsureCompanyAsync(companyName, cancellationToken);
        var category = await EnsureCategoryAsync(categoryName, cancellationToken);
        var repository = unitOfWork.Repository<Internship>();
        var entity = repository.Query().FirstOrDefault(x => x.Title == title.Trim() && x.CompanyId == company.Id);
        var internshipType = Enum.TryParse<InternshipType>(GetValue(row, "type"), true, out var type) ? type : InternshipType.Internship;
        var internshipStatus = Enum.TryParse<InternshipStatus>(GetValue(row, "status"), true, out var status) ? status : InternshipStatus.Published;
        var salaryMin = ParseDecimal(GetValue(row, "salary_min", "salarymin"));
        var salaryMax = ParseDecimal(GetValue(row, "salary_max", "salarymax"));
        var deadlineAt = ParseDate(GetValue(row, "deadline_at", "deadline"));

        if (entity is null)
        {
            await repository.AddAsync(new Internship
            {
                CompanyId = company.Id,
                CategoryId = category.Id,
                Title = title.Trim(),
                Description = GetValue(row, "description") ?? string.Empty,
                Location = GetValue(row, "location") ?? string.Empty,
                Type = internshipType,
                Status = internshipStatus,
                SalaryMin = salaryMin,
                SalaryMax = salaryMax,
                DeadlineAt = deadlineAt
            }, cancellationToken);
            return true;
        }

        entity.CategoryId = category.Id;
        entity.Description = GetValue(row, "description") ?? string.Empty;
        entity.Location = GetValue(row, "location") ?? string.Empty;
        entity.Type = internshipType;
        entity.Status = internshipStatus;
        entity.SalaryMin = salaryMin;
        entity.SalaryMax = salaryMax;
        entity.DeadlineAt = deadlineAt;
        repository.Update(entity);
        return true;
    }

    private async Task<bool> UpsertApplicationAsync(IReadOnlyDictionary<string, string> row, CancellationToken cancellationToken)
    {
        var applicantEmail = GetValue(row, "applicant_email", "email");
        var internshipTitle = GetValue(row, "internship_title", "title");
        var companyName = GetValue(row, "company", "company_name");
        var statusName = GetValue(row, "status") ?? "Submitted";

        if (string.IsNullOrWhiteSpace(applicantEmail) || string.IsNullOrWhiteSpace(internshipTitle) || string.IsNullOrWhiteSpace(companyName))
            return false;

        var user = await EnsureUserAsync(applicantEmail, cancellationToken);
        var internship = unitOfWork.Repository<Internship>().Query()
            .FirstOrDefault(x => x.Title == internshipTitle.Trim() && x.Company.Name == companyName.Trim());

        if (internship is null)
            return false;

        var status = await EnsureApplicationStatusAsync(statusName, cancellationToken);
        var repository = unitOfWork.Repository<JobApplication>();
        var entity = repository.Query().FirstOrDefault(x => x.ApplicantUserId == user.Id && x.InternshipId == internship.Id);
        if (entity is null)
        {
            await repository.AddAsync(new JobApplication
            {
                ApplicantUserId = user.Id,
                InternshipId = internship.Id,
                StatusId = status.Id,
                CoverLetter = GetValue(row, "cover_letter"),
                ResumeUrl = GetValue(row, "resume_url", "resume")
            }, cancellationToken);
            return true;
        }

        entity.StatusId = status.Id;
        entity.CoverLetter = GetValue(row, "cover_letter");
        entity.ResumeUrl = GetValue(row, "resume_url", "resume");
        repository.Update(entity);
        return true;
    }

    private async Task<bool> UpsertSettingAsync(IReadOnlyDictionary<string, string> row, CancellationToken cancellationToken)
    {
        var key = GetValue(row, "key");
        if (string.IsNullOrWhiteSpace(key))
            return false;

        var repository = unitOfWork.Repository<Setting>();
        var entity = repository.Query().FirstOrDefault(x => x.Key == key.Trim());
        if (entity is null)
        {
            await repository.AddAsync(new Setting
            {
                Key = key.Trim(),
                Value = GetValue(row, "value") ?? string.Empty,
                Group = GetValue(row, "group"),
                IsEncrypted = ParseBool(GetValue(row, "is_encrypted"))
            }, cancellationToken);
            return true;
        }

        entity.Value = GetValue(row, "value") ?? string.Empty;
        entity.Group = GetValue(row, "group");
        entity.IsEncrypted = ParseBool(GetValue(row, "is_encrypted"));
        repository.Update(entity);
        return true;
    }

    private async Task<Company> EnsureCompanyAsync(string companyName, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<Company>();
        var company = repository.Query().FirstOrDefault(x => x.Name == companyName.Trim());
        if (company is not null)
            return company;

        company = new Company { Name = companyName.Trim(), IsVerified = false };
        await repository.AddAsync(company, cancellationToken);
        return company;
    }

    private async Task<Category> EnsureCategoryAsync(string categoryName, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<Category>();
        var category = repository.Query().FirstOrDefault(x => x.Name == categoryName.Trim());
        if (category is not null)
            return category;

        category = new Category { Name = categoryName.Trim() };
        await repository.AddAsync(category, cancellationToken);
        return category;
    }

    private async Task<User> EnsureUserAsync(string email, CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var users = unitOfWork.Repository<User>();
        var user = users.Query().FirstOrDefault(x => x.Email == normalizedEmail);
        if (user is not null)
            return user;

        var studentRole = unitOfWork.Repository<Domain.Entities.Role>().Query().FirstOrDefault(x => x.Name == "Student");
        user = new User
        {
            Email = normalizedEmail,
            FirstName = "Imported",
            LastName = "Student",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"), workFactor: 10),
            IsActive = true
        };
        if (studentRole is not null)
            user.UserRoles.Add(new UserRole { User = user, Role = studentRole });

        await users.AddAsync(user, cancellationToken);
        return user;
    }

    private async Task<ApplicationStatus> EnsureApplicationStatusAsync(string statusName, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<ApplicationStatus>();
        var status = repository.Query().FirstOrDefault(x => x.Name == statusName.Trim());
        if (status is not null)
            return status;

        status = new ApplicationStatus { Name = statusName.Trim(), SortOrder = repository.Query().Count() + 1 };
        await repository.AddAsync(status, cancellationToken);
        return status;
    }

    private async Task InvalidateCachesAsync(string entity, CancellationToken cancellationToken)
    {
        var normalized = entity.Trim().ToLowerInvariant();
        await cacheService.RemoveByPrefixAsync($"catalog:{normalized}", cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:internships", cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:companies", cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:categories", cancellationToken);
        await cacheService.RemoveByPrefixAsync("catalog:applications", cancellationToken);
    }

    private static List<Dictionary<string, string>> ReadRows(string format, Stream content)
    {
        return format.ToLowerInvariant() switch
        {
            "json" => ReadJsonRows(content),
            "xlsx" or "excel" => ReadExcelRows(content),
            _ => ReadCsvRows(content)
        };
    }

    private static List<Dictionary<string, string>> ReadCsvRows(Stream content)
    {
        using var reader = new StreamReader(content, Encoding.UTF8, true, leaveOpen: true);
        var text = reader.ReadToEnd();
        var lines = text.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (lines.Length == 0)
            return [];

        var headers = ParseCsvLine(lines[0]);
        var normalizedHeaders = headers.Select(NormalizeKey).ToArray();
        var rows = new List<Dictionary<string, string>>();

        for (var lineIndex = 1; lineIndex < lines.Length; lineIndex++)
        {
            var fields = ParseCsvLine(lines[lineIndex]);
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var index = 0; index < normalizedHeaders.Length && index < fields.Count; index++)
            {
                row[normalizedHeaders[index]] = fields[index];
            }
            rows.Add(row);
        }

        return rows;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var builder = new StringBuilder();
        var inQuotes = false;

        for (var index = 0; index < line.Length; index++)
        {
            var character = line[index];
            if (character == '"')
            {
                if (inQuotes && index + 1 < line.Length && line[index + 1] == '"')
                {
                    builder.Append('"');
                    index++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }

                continue;
            }

            if (character == ',' && !inQuotes)
            {
                values.Add(builder.ToString().Trim());
                builder.Clear();
                continue;
            }

            builder.Append(character);
        }

        values.Add(builder.ToString().Trim());
        return values;
    }

    private static List<Dictionary<string, string>> ReadJsonRows(Stream content)
    {
        using var document = JsonDocument.Parse(content);
        if (document.RootElement.ValueKind != JsonValueKind.Array)
            return [];

        var rows = new List<Dictionary<string, string>>();
        foreach (var item in document.RootElement.EnumerateArray())
        {
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in item.EnumerateObject())
            {
                row[NormalizeKey(property.Name)] = property.Value.ValueKind switch
                {
                    JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                    JsonValueKind.Number => property.Value.GetRawText(),
                    JsonValueKind.True => "true",
                    JsonValueKind.False => "false",
                    JsonValueKind.Null => string.Empty,
                    _ => property.Value.GetRawText()
                };
            }
            rows.Add(row);
        }

        return rows;
    }

    private static List<Dictionary<string, string>> ReadExcelRows(Stream content)
    {
        using var workbook = new XLWorkbook(content);
        var sheet = workbook.Worksheets.First();
        var usedRange = sheet.RangeUsed();
        if (usedRange is null)
            return [];

        var headers = sheet.Row(1).Cells().Select(cell => NormalizeKey(cell.GetString())).Where(value => !string.IsNullOrWhiteSpace(value)).ToArray();
        var rows = new List<Dictionary<string, string>>();

        foreach (var row in sheet.RowsUsed().Skip(1))
        {
            var data = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var index = 0; index < headers.Length; index++)
            {
                data[headers[index]] = row.Cell(index + 1).GetString();
            }
            rows.Add(data);
        }

        return rows;
    }

    private static string NormalizeKey(string key) => key.Trim().ToLowerInvariant().Replace(' ', '_').Replace('-', '_');

    private static string? GetValue(IReadOnlyDictionary<string, string> row, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            var normalized = NormalizeKey(candidate);
            if (row.TryGetValue(normalized, out var value) && !string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return null;
    }

    private static bool ParseBool(string? value) =>
        !string.IsNullOrWhiteSpace(value) &&
        (value.Equals("true", StringComparison.OrdinalIgnoreCase) || value == "1" || value.Equals("yes", StringComparison.OrdinalIgnoreCase));

    private static decimal? ParseDecimal(string? value) =>
        decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed) ? parsed : null;

    private static DateTime? ParseDate(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed)
            ? parsed
            : null;
}

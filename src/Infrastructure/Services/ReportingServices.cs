using System.Text;
using System.Text.Json;
using Application.DTOs;
using Application.Interfaces;
using ClosedXML.Excel;
using Domain.Entities;
using Domain.Enums;

namespace Infrastructure.Services;

public sealed class ExportService(IUnitOfWork unitOfWork) : IExportService
{
    public Task<(byte[] Content, string ContentType, string FileName)> ExportAsync(ExportRequestDto request, CancellationToken cancellationToken = default)
    {
        var rows = request.Entity.ToLowerInvariant() switch
        {
            "companies" => unitOfWork.Repository<Company>().Query().Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.Website,
                x.Location,
                x.IsVerified,
                x.CreatedAt
            }).AsEnumerable().Cast<object>().ToList(),
            "categories" => unitOfWork.Repository<Category>().Query().Select(x => new { x.Id, x.Name, x.Description, x.CreatedAt }).AsEnumerable().Cast<object>().ToList(),
            "internships" => ApplyInternshipFilters(request).Select(x => new
            {
                x.Id,
                Company = x.Company.Name,
                Category = x.Category.Name,
                x.Title,
                x.Description,
                x.Location,
                x.Type,
                x.Status,
                x.SalaryMin,
                x.SalaryMax,
                x.DeadlineAt,
                x.CreatedAt
            }).AsEnumerable().Cast<object>().ToList(),
            "applications" => unitOfWork.Repository<JobApplication>().Query().Select(x => new
            {
                x.Id,
                ApplicantEmail = x.ApplicantUser.Email,
                InternshipTitle = x.Internship.Title,
                CompanyName = x.Internship.Company.Name,
                ApplicantName = $"{x.ApplicantUser.FirstName} {x.ApplicantUser.LastName}",
                x.CoverLetter,
                x.ResumeUrl,
                Status = x.Status.Name,
                x.CreatedAt
            }).AsEnumerable().Cast<object>().ToList(),
            "settings" => unitOfWork.Repository<Setting>().Query().Select(x => new
            {
                x.Id,
                x.Key,
                x.Value,
                x.Group,
                x.IsEncrypted,
                x.CreatedAt
            }).AsEnumerable().Cast<object>().ToList(),
            _ => throw new InvalidOperationException("Unsupported export entity.")
        };

        var export = request.Format.ToLowerInvariant() switch
        {
            "excel" or "xlsx" => ExportExcel(rows, request.Entity),
            "json" => (Content: JsonSerializer.SerializeToUtf8Bytes(rows), ContentType: "application/json", FileName: $"{request.Entity}.json"),
            _ => (Content: ExportCsv(rows), ContentType: "text/csv", FileName: $"{request.Entity}.csv")
        };

        return Task.FromResult(export);
    }

    private IQueryable<Internship> ApplyInternshipFilters(ExportRequestDto request)
    {
        var query = unitOfWork.Repository<Internship>().Query();
        if (request.Filters is null)
            return query;

        if (request.Filters.TryGetValue("search", out var search) && !string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Title.Contains(search) || x.Description.Contains(search) || x.Location.Contains(search));
        }

        if (request.Filters.TryGetValue("location", out var location) && !string.IsNullOrWhiteSpace(location))
        {
            query = query.Where(x => x.Location.Contains(location));
        }

        if (request.Filters.TryGetValue("status", out var status) && Enum.TryParse<InternshipStatus>(status, true, out var internshipStatus))
        {
            query = query.Where(x => x.Status == internshipStatus);
        }

        if (request.Filters.TryGetValue("company", out var company) && !string.IsNullOrWhiteSpace(company))
        {
            query = query.Where(x => x.Company.Name.Contains(company));
        }

        if (request.Filters.TryGetValue("category", out var category) && !string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category.Name.Contains(category));
        }

        if (request.Filters.TryGetValue("from", out var from) && DateTime.TryParse(from, out var fromDate))
        {
            query = query.Where(x => x.CreatedAt >= fromDate);
        }

        if (request.Filters.TryGetValue("to", out var to) && DateTime.TryParse(to, out var toDate))
        {
            query = query.Where(x => x.CreatedAt <= toDate);
        }

        return query;
    }

    private static (byte[] Content, string ContentType, string FileName) ExportExcel(IReadOnlyList<object> rows, string entity)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(entity);
        sheet.Cell(1, 1).InsertTable(rows);
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{entity}.xlsx");
    }

    private static byte[] ExportCsv(IReadOnlyList<object> rows)
    {
        var sb = new StringBuilder();
        if (rows.Count == 0)
            return Encoding.UTF8.GetBytes(string.Empty);

        var props = rows[0].GetType().GetProperties();
        sb.AppendLine(string.Join(',', props.Select(x => x.Name)));
        foreach (var row in rows)
            sb.AppendLine(string.Join(',', props.Select(x => Escape(x.GetValue(row)?.ToString()))));
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string Escape(string? value) => value is null ? string.Empty : $"\"{value.Replace("\"", "\"\"")}\"";
}

public sealed class ReportService(IUnitOfWork unitOfWork) : IReportService
{
    public async Task<ReportDto> GenerateAsync(ReportRequestDto request, CancellationToken cancellationToken = default)
    {
        var parameters = request.Parameters ?? new Dictionary<string, string>();
        DateTime? fromDate = parameters.TryGetValue("from", out var from) && DateTime.TryParse(from, out var parsedFrom) ? parsedFrom : null;
        DateTime? toDate = parameters.TryGetValue("to", out var to) && DateTime.TryParse(to, out var parsedTo) ? parsedTo : null;

        IQueryable<Internship> internships = unitOfWork.Repository<Internship>().Query();
        IQueryable<JobApplication> applications = unitOfWork.Repository<JobApplication>().Query();
        IQueryable<Company> companies = unitOfWork.Repository<Company>().Query();
        IQueryable<User> users = unitOfWork.Repository<User>().Query();

        if (fromDate.HasValue)
        {
            internships = internships.Where(x => x.CreatedAt >= fromDate.Value);
            applications = applications.Where(x => x.CreatedAt >= fromDate.Value);
            companies = companies.Where(x => x.CreatedAt >= fromDate.Value);
            users = users.Where(x => x.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            internships = internships.Where(x => x.CreatedAt <= toDate.Value);
            applications = applications.Where(x => x.CreatedAt <= toDate.Value);
            companies = companies.Where(x => x.CreatedAt <= toDate.Value);
            users = users.Where(x => x.CreatedAt <= toDate.Value);
        }

        object payload = request.Type switch
        {
            Domain.Enums.ReportType.Applications => new
            {
                Total = applications.Count(),
                Approved = applications.Count(x => x.Status.Name == "Accepted"),
                Rejected = applications.Count(x => x.Status.Name == "Rejected"),
                ByStatus = applications.GroupBy(x => x.Status.Name).Select(x => new { Status = x.Key, Count = x.Count() }).ToList()
            },
            Domain.Enums.ReportType.Companies => new
            {
                Total = companies.Count(),
                Verified = companies.Count(x => x.IsVerified),
                ByLocation = companies.GroupBy(x => x.Location ?? "Unknown").Select(x => new { Location = x.Key, Count = x.Count() }).ToList()
            },
            Domain.Enums.ReportType.Users => new
            {
                Total = users.Count(),
                Active = users.Count(x => x.IsActive),
                Inactive = users.Count(x => !x.IsActive)
            },
            _ => new
            {
                Total = internships.Count(),
                Published = internships.Count(x => x.Status == InternshipStatus.Published),
                Draft = internships.Count(x => x.Status == InternshipStatus.Draft),
                ByType = internships.GroupBy(x => x.Type).Select(x => new { Type = x.Key.ToString(), Count = x.Count() }).ToList()
            }
        };

        var report = new Report
        {
            Name = request.Name,
            Type = request.Type,
            ParametersJson = JsonSerializer.Serialize(parameters),
            ResultJson = JsonSerializer.Serialize(payload)
        };
        await unitOfWork.Repository<Report>().AddAsync(report, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new ReportDto(report.Id, report.Name, report.Type, report.ResultJson, report.CreatedAt);
    }
}

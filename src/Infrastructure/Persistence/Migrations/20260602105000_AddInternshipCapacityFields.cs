using System;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260602105000_AddInternshipCapacityFields")]
public partial class AddInternshipCapacityFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "CurrentApplicants",
            table: "Internships",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "MaxApplicants",
            table: "Internships",
            type: "int",
            nullable: false,
            defaultValue: 5);

        migrationBuilder.Sql(@"
UPDATE I
SET CurrentApplicants = ISNULL(A.TotalApplications, 0)
FROM Internships AS I
LEFT JOIN (
    SELECT InternshipId, COUNT(*) AS TotalApplications
    FROM Applications
    GROUP BY InternshipId
) AS A ON A.InternshipId = I.Id;
");

        migrationBuilder.Sql(@"
UPDATE Internships
SET MaxApplicants = CASE
    WHEN CurrentApplicants >= MaxApplicants THEN CurrentApplicants + 1
    ELSE MaxApplicants
END;
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CurrentApplicants",
            table: "Internships");

        migrationBuilder.DropColumn(
            name: "MaxApplicants",
            table: "Internships");
    }
}

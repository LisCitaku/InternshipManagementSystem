using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedDemoCompanies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Companies",
                columns: new[] { "Id", "created_at", "created_by", "Description", "IsVerified", "Location", "Name", "updated_at", "updated_by", "Website" },
                values: new object[,]
                {
                    { new Guid("cccccccc-cccc-cccc-cccc-ccccccccccc1"), new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), null, "AI and cloud product studio", true, "Tirane", "Northstar Labs", null, null, "https://northstar.dev" },
                    { new Guid("cccccccc-cccc-cccc-cccc-ccccccccccc2"), new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), null, "Govtech and digital services partner", true, "Prishtine", "Civic Stack", null, null, "https://civicstack.io" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Companies",
                keyColumn: "Id",
                keyValue: new Guid("cccccccc-cccc-cccc-cccc-ccccccccccc1"));

            migrationBuilder.DeleteData(
                table: "Companies",
                keyColumn: "Id",
                keyValue: new Guid("cccccccc-cccc-cccc-cccc-ccccccccccc2"));
        }
    }
}

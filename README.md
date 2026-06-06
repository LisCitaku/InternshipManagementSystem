# Internship & Job Management Platform API

Production-oriented ASP.NET Core 9 Web API backend using Clean Architecture, EF Core, SQL Server, Redis, JWT, SignalR, MediatR, AutoMapper, FluentValidation, Swagger, and EF migrations.

## Architecture

The solution is split into four layers:

- `src/Domain`: persistence-ignorant entities, enums, and shared domain shape.
- `src/Application`: DTOs, CQRS commands/queries, handlers, validation, result pattern, and interfaces.
- `src/Infrastructure`: EF Core `AppDbContext`, repositories, Unit of Work, SQL Server, Redis registration, JWT, BCrypt, exports, reports, and migrations.
- `src/Api`: controllers, middleware, auth/CORS/Swagger setup, SignalR hubs, and current-user/notification dispatch adapters.

Controllers only handle HTTP transport and call MediatR. Business rules live in handlers/services. Database access is isolated behind repositories and infrastructure services.

## Implemented Capabilities

- JWT access tokens and refresh tokens with hashed refresh-token storage.
- Role-based authorization with seeded `Admin`, `Company`, and `Student` roles.
- BCrypt password hashing.
- `.env` loading through `DotNetEnv`.
- CORS policy from `CORS_ALLOWED_ORIGINS`.
- FluentValidation pipeline for request DTOs.
- Global exception middleware with standardized API responses.
- EF Core SQL Server schema for all required tables with foreign keys, indexes, audit columns, and seed data.
- CQRS endpoints for auth, users, companies, internships, applications, notifications, chat, reports, CMS, import/export, and data operations.
- SignalR hubs at `/hubs/notifications` and `/hubs/chat`.
- CSV, JSON, and Excel export support for five business/admin lists.
- Dynamic report generation persisted to `Reports` with date filters and grouped metrics.
- Redis-backed caching for public catalog queries and CMS pages.
- CMS-backed public landing/about content managed from the admin UI.

## Setup

1. Make sure SQL Server LocalDB is installed on your machine.
2. Copy `.env.example` to `.env` and adjust the LocalDB instance name only if your machine uses something other than `MSSQLLocalDB`.
3. Start supporting services:

```powershell
docker compose up -d
```

Docker Compose now starts Redis only. The API uses LocalDB via `(localdb)\MSSQLLocalDB` for local development.

4. Restore and build:

```powershell
dotnet restore
dotnet build -m:1
```

5. Apply migrations:

```powershell
dotnet ef database update --project src/Infrastructure/Infrastructure.csproj --startup-project src/Api/Api.csproj
```

6. Run the API:

```powershell
dotnet run --project src/Api/Api.csproj
```

On startup, the API ensures a local development admin account exists:
`admin@admin.com` / `admin@admin.com`

Swagger UI is available at `/swagger` in Development.

## Documentation

- API docs: Swagger/OpenAPI in `/swagger`
- ERD: [docs/erd.md](docs/erd.md)

## Migration Workflow

Create a new migration after entity or relationship changes:

```powershell
dotnet build -m:1
dotnet ef migrations add DescriptiveMigrationName --project src/Infrastructure/Infrastructure.csproj --startup-project src/Api/Api.csproj --output-dir Persistence/Migrations --no-build
dotnet ef database update --project src/Infrastructure/Infrastructure.csproj --startup-project src/Api/Api.csproj
```

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `GET /api/users`
- `GET /api/companies`
- `GET /api/internships`
- `GET /api/internships/{id}`
- `POST /api/internships`
- `POST /api/applications`
- `GET /api/notifications`
- `POST /api/chat/messages`
- `POST /api/reports/generate`
- `POST /api/reports/export`
- `POST /api/reports/import`
- `GET /api/cms/{pageKey}`
- `PUT /api/cms/{pageKey}`

## Content Management

The CMS uses the `Settings` table with `cms:`-prefixed keys to store static content separately from business data.
The public landing page reads from the CMS API, so edits in the admin panel are immediately visible on the website.

## Data Exchange

The import/export pipeline covers `categories`, `companies`, `internships`, `applications`, and `settings`.
Supported formats are CSV, JSON, and Excel (`.xlsx`).

## Notes

Use strong production values for `JWT_SECRET`, SQL Server passwords, and CORS origins. The generated `InitialCreate` migration contains all required tables and indexes, including `created_at`, `updated_at`, `created_by`, and `updated_by` audit columns.

## Contributors

- Diellon Haxhaj
- Endrit Racaj
- Lis Citaku
- Valmir Gllareva

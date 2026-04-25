using Application.Interfaces;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration["SQLSERVER_CONNECTION_STRING"] ?? configuration.GetConnectionString("DefaultConnection");
        Console.WriteLine($"[DB] Using connection string: {connectionString}");
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString)
                .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning)));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IExportService, ExportService>();
        services.AddScoped<IImportService, ImportService>();
        services.AddScoped<IReportService, ReportService>();

        IConnectionMultiplexer? connectionMultiplexer = null;
        var redisConnection = configuration["REDIS_CONNECTION_STRING"] ?? configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            var redisOptions = ConfigurationOptions.Parse(redisConnection);
            redisOptions.AbortOnConnectFail = false;
            redisOptions.AllowAdmin = true;
            connectionMultiplexer = ConnectionMultiplexer.Connect(redisOptions);
            services.AddSingleton<IConnectionMultiplexer>(connectionMultiplexer);
        }

        services.AddSingleton<ICacheService>(_ => new RedisCacheService(connectionMultiplexer));
        services.AddScoped<ICmsService, CmsService>();

        return services;
    }
}

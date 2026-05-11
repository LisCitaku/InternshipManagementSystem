using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services;

public sealed class BCryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    public bool Verify(string password, string passwordHash) => BCrypt.Net.BCrypt.Verify(password, passwordHash);
}

public sealed class JwtTokenService(IConfiguration configuration, IUnitOfWork unitOfWork) : IJwtTokenService
{
    public async Task<AuthResponseDto> CreateTokenAsync(User user, CancellationToken cancellationToken = default)
    {
        var roles = unitOfWork.Repository<UserRole>().Query().Where(x => x.UserId == user.Id).Select(x => x.Role.Name).ToList();
        var key = configuration["JWT_SECRET"] ?? configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT secret is not configured.");
        var issuer = configuration["JWT_ISSUER"] ?? configuration["Jwt:Issuer"] ?? "InternshipJobManagement";
        var audience = configuration["JWT_AUDIENCE"] ?? configuration["Jwt:Audience"] ?? "InternshipJobManagementClient";
        var expiresAt = DateTime.UtcNow.AddMinutes(int.TryParse(configuration["JWT_ACCESS_TOKEN_MINUTES"], out var minutes) ? minutes : 60);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer, audience, claims, expires: expiresAt, signingCredentials: credentials);
        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        await unitOfWork.Repository<RefreshToken>().AddAsync(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashRefreshToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(int.TryParse(configuration["JWT_REFRESH_TOKEN_DAYS"], out var days) ? days : 14),
            CreatedBy = user.Id
        }, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(accessToken, refreshToken, expiresAt, new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.PhoneNumber, user.IsActive, roles));
    }

    public string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }
}

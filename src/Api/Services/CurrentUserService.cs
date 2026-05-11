using System.Security.Claims;
using Application.Interfaces;

namespace Api.Services;

public sealed class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUserService
{
    public Guid? UserId => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    public string? Email => accessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);
    public bool IsAuthenticated => accessor.HttpContext?.User.Identity?.IsAuthenticated == true;
}


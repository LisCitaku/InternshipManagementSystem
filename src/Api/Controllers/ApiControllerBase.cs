using Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.Succeeded)
            return Ok(ApiResponse<T>.From(result));

        return BadRequest(ApiResponse<T>.From(result));
    }
}


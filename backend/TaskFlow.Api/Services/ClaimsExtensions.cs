using System.Security.Claims;

namespace TaskFlow.Api.Services;

public static class ClaimsExtensions
{
    /// <summary>The authenticated user's id, read from the validated JWT.</summary>
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

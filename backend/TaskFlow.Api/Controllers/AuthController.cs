using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using TaskFlow.Api.Dtos;
using TaskFlow.Api.Models;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;

    public AuthController(AppDbContext db, ITokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new ProblemDetails { Title = "Email already registered", Detail = "An account with this email already exists." });

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        // Friendly starter categories so the dashboard isn't empty
        user.Categories.AddRange(new[]
        {
            new Category { Name = "Work", Color = "#6366f1" },
            new Category { Name = "Personal", Color = "#10b981" },
            new Category { Name = "Learning", Color = "#f59e0b" }
        });

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(BuildResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Same message for unknown email and wrong password: don't leak which accounts exist
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new ProblemDetails { Title = "Invalid credentials", Detail = "Incorrect email or password." });

        return Ok(BuildResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await _db.Users.FindAsync(User.GetUserId());
        return user is null ? Unauthorized() : new UserDto(user.Id, user.Name, user.Email);
    }

    private AuthResponse BuildResponse(User user)
    {
        var (token, expires) = _tokens.CreateToken(user);
        return new AuthResponse(token, expires, new UserDto(user.Id, user.Name, user.Email));
    }
}

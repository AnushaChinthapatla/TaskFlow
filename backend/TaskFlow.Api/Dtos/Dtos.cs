using System.ComponentModel.DataAnnotations;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Dtos;

// ---------- Auth ----------
public record RegisterRequest(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters.")] string Password);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record UserDto(int Id, string Name, string Email);
public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);

// ---------- Categories ----------
public record CategoryRequest(
    [Required, StringLength(50, MinimumLength = 1)] string Name,
    [RegularExpression("^#[0-9a-fA-F]{6}$", ErrorMessage = "Color must be a hex value like #6366f1.")] string Color);

public record CategoryDto(int Id, string Name, string Color, int TaskCount);

// ---------- Tasks ----------
public record TaskRequest(
    [Required, StringLength(150, MinimumLength = 1)] string Title,
    [StringLength(2000)] string? Description,
    TaskState Status,
    TaskPriority Priority,
    DateOnly? DueDate,
    int? CategoryId);

public record StatusUpdateRequest(TaskState Status);

public record TaskDto(
    int Id, string Title, string? Description, TaskState Status, TaskPriority Priority,
    DateOnly? DueDate, bool IsOverdue, DateTime CreatedAt, DateTime? CompletedAt, int? CategoryId);

public record TaskStatsDto(int Total, int Todo, int InProgress, int Done, int Overdue);

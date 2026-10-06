using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using TaskFlow.Api.Dtos;
using TaskFlow.Api.Models;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;
    public TasksController(AppDbContext db) => _db = db;

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    private static TaskDto ToDto(TaskItem t) => new(
        t.Id, t.Title, t.Description, t.Status, t.Priority, t.DueDate,
        t.DueDate.HasValue && t.Status != TaskState.Done && t.DueDate.Value < Today,
        t.CreatedAt, t.CompletedAt, t.CategoryId);

    /// <summary>List the current user's tasks with optional filtering, search and sorting.</summary>
    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetAll(
        [FromQuery] TaskState? status,
        [FromQuery] TaskPriority? priority,
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        [FromQuery] string sort = "created")
    {
        var userId = User.GetUserId();
        var query = _db.Tasks.AsNoTracking().Where(t => t.UserId == userId);

        if (status.HasValue) query = query.Where(t => t.Status == status);
        if (priority.HasValue) query = query.Where(t => t.Priority == priority);
        if (categoryId.HasValue) query = query.Where(t => t.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(t => t.Title.Contains(term) || (t.Description != null && t.Description.Contains(term)));
        }

        query = sort switch
        {
            "due" => query.OrderBy(t => t.DueDate == null).ThenBy(t => t.DueDate),
            "priority" => query.OrderByDescending(t => t.Priority == TaskPriority.High)
                               .ThenByDescending(t => t.Priority == TaskPriority.Medium)
                               .ThenByDescending(t => t.CreatedAt),
            _ => query.OrderByDescending(t => t.CreatedAt)
        };

        var items = await query.ToListAsync();
        return items.Select(ToDto).ToList();
    }

    [HttpGet("stats")]
    public async Task<ActionResult<TaskStatsDto>> Stats()
    {
        var userId = User.GetUserId();
        var today = Today;
        var tasks = _db.Tasks.AsNoTracking().Where(t => t.UserId == userId);

        return new TaskStatsDto(
            await tasks.CountAsync(),
            await tasks.CountAsync(t => t.Status == TaskState.Todo),
            await tasks.CountAsync(t => t.Status == TaskState.InProgress),
            await tasks.CountAsync(t => t.Status == TaskState.Done),
            await tasks.CountAsync(t => t.Status != TaskState.Done && t.DueDate != null && t.DueDate < today));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDto>> Get(int id)
    {
        var userId = User.GetUserId();
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        return task is null ? NotFound() : ToDto(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create(TaskRequest req)
    {
        var userId = User.GetUserId();
        if (!await CategoryBelongsToUser(req.CategoryId, userId))
            return BadRequest(new ProblemDetails { Title = "Invalid category", Detail = "That category does not exist." });

        var task = new TaskItem { UserId = userId };
        Apply(task, req);
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = task.Id }, ToDto(task));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskDto>> Update(int id, TaskRequest req)
    {
        var userId = User.GetUserId();
        // Filtering by UserId means another user's task id simply returns 404
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return NotFound();

        if (!await CategoryBelongsToUser(req.CategoryId, userId))
            return BadRequest(new ProblemDetails { Title = "Invalid category", Detail = "That category does not exist." });

        Apply(task, req);
        await _db.SaveChangesAsync();
        return ToDto(task);
    }

    /// <summary>Lightweight endpoint used by the board to move a task between columns.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<TaskDto>> UpdateStatus(int id, StatusUpdateRequest req)
    {
        var userId = User.GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return NotFound();

        SetStatus(task, req.Status);
        await _db.SaveChangesAsync();
        return ToDto(task);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return NotFound();

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- helpers ----------
    private static void Apply(TaskItem task, TaskRequest req)
    {
        task.Title = req.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        task.Priority = req.Priority;
        task.DueDate = req.DueDate;
        task.CategoryId = req.CategoryId;
        SetStatus(task, req.Status);
    }

    private static void SetStatus(TaskItem task, TaskState status)
    {
        task.Status = status;
        task.CompletedAt = status == TaskState.Done ? task.CompletedAt ?? DateTime.UtcNow : null;
    }

    private async Task<bool> CategoryBelongsToUser(int? categoryId, int userId) =>
        categoryId is null || await _db.Categories.AnyAsync(c => c.Id == categoryId && c.UserId == userId);
}

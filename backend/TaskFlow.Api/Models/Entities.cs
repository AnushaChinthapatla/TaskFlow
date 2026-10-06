namespace TaskFlow.Api.Models;

public enum TaskState { Todo, InProgress, Done }
public enum TaskPriority { Low, Medium, High }

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<TaskItem> Tasks { get; set; } = new();
    public List<Category> Categories { get; set; } = new();
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public List<TaskItem> Tasks { get; set; } = new();
}

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskState Status { get; set; } = TaskState.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateOnly? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
}

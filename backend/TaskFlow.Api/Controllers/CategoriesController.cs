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
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var userId = User.GetUserId();
        return await _db.Categories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Color, c.Tasks.Count))
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryRequest req)
    {
        var userId = User.GetUserId();
        var name = req.Name.Trim();
        if (await _db.Categories.AnyAsync(c => c.UserId == userId && c.Name == name))
            return Conflict(new ProblemDetails { Title = "Duplicate", Detail = $"You already have a category named \"{name}\"." });

        var category = new Category { Name = name, Color = req.Color, UserId = userId };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new CategoryDto(category.Id, category.Name, category.Color, 0));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategoryRequest req)
    {
        var userId = User.GetUserId();
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (category is null) return NotFound();

        var name = req.Name.Trim();
        if (await _db.Categories.AnyAsync(c => c.UserId == userId && c.Name == name && c.Id != id))
            return Conflict(new ProblemDetails { Title = "Duplicate", Detail = $"You already have a category named \"{name}\"." });

        category.Name = name;
        category.Color = req.Color;
        await _db.SaveChangesAsync();

        var count = await _db.Tasks.CountAsync(t => t.CategoryId == id);
        return new CategoryDto(category.Id, category.Name, category.Color, count);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (category is null) return NotFound();

        // Keep the user's tasks; just un-categorise them
        await _db.Tasks.Where(t => t.CategoryId == id && t.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.CategoryId, (int?)null));

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

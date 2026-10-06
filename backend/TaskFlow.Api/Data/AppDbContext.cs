using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Name).HasMaxLength(100).IsRequired();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
        });

        b.Entity<Category>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(50).IsRequired();
            e.Property(c => c.Color).HasMaxLength(9).IsRequired();
            // A user can't have two categories with the same name
            e.HasIndex(c => new { c.UserId, c.Name }).IsUnique();
            e.HasOne(c => c.User).WithMany(u => u.Categories)
             .HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<TaskItem>(e =>
        {
            e.Property(t => t.Title).HasMaxLength(150).IsRequired();
            e.Property(t => t.Description).HasMaxLength(2000);
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(t => t.Priority).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(t => new { t.UserId, t.Status });

            e.HasOne(t => t.User).WithMany(u => u.Tasks)
             .HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);

            // NoAction avoids SQL Server "multiple cascade paths"; CategoriesController
            // un-assigns tasks before deleting a category.
            e.HasOne(t => t.Category).WithMany(c => c.Tasks)
             .HasForeignKey(t => t.CategoryId).OnDelete(DeleteBehavior.NoAction);
        });
    }
}

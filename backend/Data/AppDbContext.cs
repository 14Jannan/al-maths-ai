using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<MathTopic> MathTopics { get; set; }
    public DbSet<PastPaper> PastPapers { get; set; }
    public DbSet<Resource> Resources { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<ChatUsage> ChatUsages { get; set; }
}
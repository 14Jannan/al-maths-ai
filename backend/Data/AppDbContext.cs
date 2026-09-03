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
    public DbSet<ChatConversation> ChatConversations { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<SyllabusEntry> SyllabusEntries { get; set; }
    public DbSet<DocumentChunk> DocumentChunks { get; set; }
    public DbSet<EmailOtp> EmailOtps { get; set; }
    public DbSet<ExamPaperDocument> ExamPaperDocuments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.Entity<SyllabusEntry>()
            .Property(e => e.Embedding)
            .HasColumnType("vector(1024)");
        modelBuilder.Entity<DocumentChunk>()
            .Property(e => e.Embedding)
            .HasColumnType("vector(1024)");
    }
}
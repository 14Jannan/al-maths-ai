using Microsoft.EntityFrameworkCore;
using backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Allow the frontend (running on a different port) to call this API.
// Vite bumps to the next free port (5174, 5175, ...) whenever 5173 is
// already taken by another dev server instance, which broke CORS every
// time that happened — allow any localhost/127.0.0.1 origin instead of
// hardcoding one port, since this is a local-dev-only policy anyway.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                (uri.Host == "localhost" || uri.Host == "127.0.0.1"))
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.UseVector()));

// Identity system — user registration, login, password hashing, roles
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// JWT authentication configuration
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

builder.Services.AddScoped<backend.Services.TokenService>();
builder.Services.AddScoped<backend.Services.SyllabusRetrievalService>();
builder.Services.AddHttpClient<backend.Services.IAiProvider, backend.Services.GroqAiProvider>();
builder.Services.AddHttpClient<backend.Services.SupabaseStorageService>();
builder.Services.AddHttpClient<backend.Services.CohereEmbeddingService>();
builder.Services.AddScoped<backend.Services.DocumentProcessingService>();
builder.Services.AddScoped<backend.Services.EmailService>();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// health check endpoint
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Seed the Admin role if it doesn't already exist.
// This runs once at startup, every time the app starts — cheap and idempotent.
// Seed syllabus reference data if the table is empty
// Seed syllabus reference data (with embeddings) if the table is empty
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Rows seeded before the Embedding column existed are still sitting there
    // with Embedding = NULL — !Any() alone would never catch that and those
    // rows would silently never get embedded. Wipe and reseed whenever any
    // row is missing its embedding, not just when the table is empty.
    var hasUnembedded = await db.SyllabusEntries.AnyAsync(e => e.Embedding == null);
    if (!db.SyllabusEntries.Any() || hasUnembedded)
    {
        if (hasUnembedded)
        {
            db.SyllabusEntries.RemoveRange(db.SyllabusEntries);
            await db.SaveChangesAsync();
        }

        var embeddingService = scope.ServiceProvider.GetRequiredService<backend.Services.CohereEmbeddingService>();
        var entries = backend.Data.SyllabusSeedData.GetEntries();

        foreach (var entry in entries)
        {
            var embedding = await embeddingService.GetEmbeddingAsync($"{entry.Topic}: {entry.Content}", "search_document");
            entry.Embedding = new Pgvector.Vector(embedding);
        }

        db.SyllabusEntries.AddRange(entries);
        await db.SaveChangesAsync();
    }

    // Sync MathTopics against the official syllabus list (upsert by name,
    // plus cleanup of names the syllabus no longer uses — e.g. a prior
    // correction renamed/restructured several topics). Matching names just
    // get their description/branch/icon refreshed, so any row referenced by
    // real PastPapers/Resources keeps its Id. A leftover row whose name is
    // NOT in the current list only gets deleted if nothing references it —
    // never delete out from under real content.
    var seedTopics = backend.Data.MathTopicSeedData.GetTopics();
    var seedNames = seedTopics.Select(t => t.Name).ToHashSet();
    var existingTopics = await db.MathTopics.ToDictionaryAsync(t => t.Name, t => t);

    foreach (var topic in seedTopics)
    {
        if (existingTopics.TryGetValue(topic.Name, out var existing))
        {
            existing.Description = topic.Description;
            existing.Branch = topic.Branch;
            existing.Icon = topic.Icon;
        }
        else
        {
            db.MathTopics.Add(topic);
        }
    }

    var referencedTopicIds = await db.PastPapers.Select(p => p.MathTopicId)
        .Union(db.Resources.Select(r => r.MathTopicId))
        .ToListAsync();
    var orphaned = existingTopics.Values
        .Where(t => !seedNames.Contains(t.Name) && !referencedTopicIds.Contains(t.Id))
        .ToList();
    if (orphaned.Count > 0)
    {
        db.MathTopics.RemoveRange(orphaned);
    }

    await db.SaveChangesAsync();

    // Backfill embeddings for any Resource created before the Embedding
    // column existed. Unlike SyllabusEntries, these are admin-curated real
    // links — update in place, never delete/reseed them.
    var unembeddedResources = await db.Resources.Where(r => r.Embedding == null).ToListAsync();
    if (unembeddedResources.Count > 0)
    {
        var embeddingService = scope.ServiceProvider.GetRequiredService<backend.Services.CohereEmbeddingService>();
        foreach (var resource in unembeddedResources)
        {
            var embedding = await embeddingService.GetEmbeddingAsync(resource.Title, "search_document");
            resource.Embedding = new Pgvector.Vector(embedding);
        }
        await db.SaveChangesAsync();
    }
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();
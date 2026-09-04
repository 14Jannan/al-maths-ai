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

    // Seed the 20 official MathTopics (upsert by name, not "only if empty")
    // — a handful of topics may already exist from earlier manual admin
    // entries, and those rows are referenced by real PastPapers/Resources
    // via MathTopicId, so they must keep their existing Id. Matching ones
    // just get their description refreshed; new ones are inserted.
    var existingTopics = await db.MathTopics.ToDictionaryAsync(t => t.Name, t => t);
    foreach (var topic in backend.Data.MathTopicSeedData.GetTopics())
    {
        if (existingTopics.TryGetValue(topic.Name, out var existing))
        {
            existing.Description = topic.Description;
        }
        else
        {
            db.MathTopics.Add(topic);
        }
    }
    await db.SaveChangesAsync();
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();
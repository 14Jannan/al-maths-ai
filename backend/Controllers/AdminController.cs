using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(AppDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var weekAgo = DateTime.UtcNow.AddDays(-7);

        var totalUsers = await _userManager.Users.CountAsync();
        var adminUserIds = await _userManager.GetUsersInRoleAsync("Admin");

        var overview = new AdminOverviewDto
        {
            TotalUsers = totalUsers,
            AdminCount = adminUserIds.Count,
            PremiumSubscribers = await _context.Subscriptions.CountAsync(s => s.Status == "Active" && s.ExpiresAt > DateTime.UtcNow),
            TopicsCount = await _context.MathTopics.CountAsync(),
            PastPaperQuestionsCount = await _context.PastPapers.CountAsync(),
            ResourcesCount = await _context.Resources.CountAsync(),
            ExamPaperDocumentsCount = await _context.ExamPaperDocuments.CountAsync(),
            DocumentChunksCount = await _context.DocumentChunks.CountAsync(),
            ChatMessagesToday = await _context.ChatMessages.CountAsync(m => m.CreatedAt.Date == DateTime.UtcNow.Date),
            NewUsersThisWeek = await _userManager.Users.CountAsync(u => u.CreatedAt >= weekAgo)
        };

        return Ok(overview);
    }

    // Three real, DB-backed charts for the Overview page — nothing here is
    // mocked or invented:
    //  - User Growth: daily new-signup counts from ApplicationUser.CreatedAt
    //    (only tracked from when that column was added — existing accounts
    //    from before then all show up on that migration date, which is the
    //    honest answer since their real join dates were never recorded).
    //  - Most-Asked Topics: how many student chat messages mention each
    //    topic's name (case-insensitive substring match) — an approximate
    //    but genuine usage signal, since chat messages aren't tagged with a
    //    topic anywhere else in the schema.
    //  - Free vs Premium: split of the same PremiumSubscribers logic used
    //    in GetOverview above.
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        const int days = 30;
        var since = DateTime.UtcNow.Date.AddDays(-(days - 1));

        var signups = await _userManager.Users
            .Where(u => u.CreatedAt >= since)
            .Select(u => u.CreatedAt.Date)
            .ToListAsync();
        var signupCounts = signups.GroupBy(d => d).ToDictionary(g => g.Key, g => g.Count());

        var totalUsersBeforeWindow = await _userManager.Users.CountAsync(u => u.CreatedAt < since);
        var cumulative = totalUsersBeforeWindow;
        var userGrowth = new List<UserGrowthPointDto>();
        for (var day = since; day <= DateTime.UtcNow.Date; day = day.AddDays(1))
        {
            var newUsers = signupCounts.GetValueOrDefault(day, 0);
            cumulative += newUsers;
            userGrowth.Add(new UserGrowthPointDto { Date = day.ToString("yyyy-MM-dd"), NewUsers = newUsers, CumulativeUsers = cumulative });
        }

        var topics = await _context.MathTopics.Select(t => t.Name).ToListAsync();
        var userMessages = await _context.ChatMessages
            .Where(m => m.Role == "user")
            .Select(m => m.Content)
            .ToListAsync();
        var mostAskedTopics = topics
            .Select(topic => new TopicUsageDto
            {
                Topic = topic,
                MentionCount = userMessages.Count(m => m.Contains(topic, StringComparison.OrdinalIgnoreCase))
            })
            .Where(t => t.MentionCount > 0)
            .OrderByDescending(t => t.MentionCount)
            .Take(8)
            .ToList();

        var premiumUsers = await _context.Subscriptions.CountAsync(s => s.Status == "Active" && s.ExpiresAt > DateTime.UtcNow);
        var totalUsers = await _userManager.Users.CountAsync();

        return Ok(new AdminAnalyticsDto
        {
            UserGrowth = userGrowth,
            MostAskedTopics = mostAskedTopics,
            PremiumUsers = premiumUsers,
            FreeUsers = Math.Max(0, totalUsers - premiumUsers)
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var subscriptions = await _context.Subscriptions.ToListAsync();
        var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
        var adminIds = adminUsers.Select(u => u.Id).ToHashSet();

        var result = users.Select(u =>
        {
            var sub = subscriptions.FirstOrDefault(s => s.UserId == u.Id);
            var isPremium = sub is { Status: "Active" } && sub.ExpiresAt > DateTime.UtcNow;
            return new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email ?? string.Empty,
                EmailConfirmed = u.EmailConfirmed,
                IsAdmin = adminIds.Contains(u.Id),
                IsPremium = isPremium,
                SubscriptionExpiresAt = sub?.ExpiresAt?.ToString("yyyy-MM-dd")
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost("users/{id}/role")]
    public async Task<IActionResult> SetRole(string id, SetRoleDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        // Don't let an admin accidentally remove their own last-admin access
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;
        if (id == currentUserId && !dto.IsAdmin)
        {
            return BadRequest("You can't remove your own Admin role.");
        }

        var isCurrentlyAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (dto.IsAdmin && !isCurrentlyAdmin)
        {
            await _userManager.AddToRoleAsync(user, "Admin");
        }
        else if (!dto.IsAdmin && isCurrentlyAdmin)
        {
            await _userManager.RemoveFromRoleAsync(user, "Admin");
        }

        return NoContent();
    }
}
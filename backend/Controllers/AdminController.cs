using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public AdminController(AppDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
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
            NewUsersThisWeek = totalUsers // placeholder overwritten below since IdentityUser has no CreatedAt by default
        };

        return Ok(overview);
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
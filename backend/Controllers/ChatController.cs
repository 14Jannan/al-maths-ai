using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // must be logged in — we track usage per user
public class ChatController : ControllerBase
{
    private const int FreeDailyLimit = 10;

    private readonly IAiProvider _aiProvider;
    private readonly AppDbContext _context;

    public ChatController(IAiProvider aiProvider, AppDbContext context)
    {
        _aiProvider = aiProvider;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage(ChatRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest("Message cannot be empty");
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;

        // Premium users skip the daily limit entirely
        var subscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId);
        var isPremium = subscription is { Status: "Active", ExpiresAt: not null } && subscription.ExpiresAt > DateTime.UtcNow;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (!isPremium)
        {
            var usage = await _context.ChatUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);
            var currentCount = usage?.Count ?? 0;

            if (currentCount >= FreeDailyLimit)
            {
                return StatusCode(429, new
                {
                    error = "Daily free limit reached",
                    limit = FreeDailyLimit,
                    resetsAt = today.AddDays(1).ToDateTime(TimeOnly.MinValue)
                });
            }
        }

        try
        {
            var reply = await _aiProvider.GetCompletionAsync(dto.Message);

            // Only count successful, non-premium requests toward the limit
            if (!isPremium)
            {
                var usage = await _context.ChatUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);
                if (usage == null)
                {
                    usage = new backend.Models.ChatUsage { UserId = userId, Date = today, Count = 0 };
                    _context.ChatUsages.Add(usage);
                }
                usage.Count += 1;
                await _context.SaveChangesAsync();
            }

            return Ok(new ChatResponseDto { Reply = reply });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = "AI service is currently unavailable", details = ex.Message });
        }
    }

    // Lets the frontend show "x of 10 questions used today" before sending a message
    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;
        var subscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId);
        var isPremium = subscription is { Status: "Active", ExpiresAt: not null } && subscription.ExpiresAt > DateTime.UtcNow;

        if (isPremium)
        {
            return Ok(new { isPremium = true, used = 0, limit = (int?)null });
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var usage = await _context.ChatUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);

        return Ok(new { isPremium = false, used = usage?.Count ?? 0, limit = FreeDailyLimit });
    }
}
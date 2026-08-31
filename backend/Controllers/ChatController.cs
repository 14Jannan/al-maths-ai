using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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

    private string CurrentUserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;

    [HttpPost]
    public async Task<IActionResult> SendMessage(ChatRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest("Message cannot be empty");
        }

        var userId = CurrentUserId;

        var subscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId);
        var isPremium = subscription is { Status: "Active", ExpiresAt: not null } && subscription.ExpiresAt > DateTime.UtcNow;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (!isPremium)
        {
            var existingUsage = await _context.ChatUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);
            if ((existingUsage?.Count ?? 0) >= FreeDailyLimit)
            {
                return StatusCode(429, new
                {
                    error = "Daily free limit reached",
                    limit = FreeDailyLimit,
                    resetsAt = today.AddDays(1).ToDateTime(TimeOnly.MinValue)
                });
            }
        }

        // Find the existing conversation, or start a new one for this user
        ChatConversation? conversation = null;
        if (dto.ConversationId.HasValue)
        {
            conversation = await _context.ChatConversations
                .FirstOrDefaultAsync(c => c.Id == dto.ConversationId.Value && c.UserId == userId);
        }
        if (conversation == null)
        {
            conversation = new ChatConversation
            {
                UserId = userId,
                Title = dto.Message.Length > 50 ? dto.Message[..50] + "…" : dto.Message
            };
            _context.ChatConversations.Add(conversation);
            await _context.SaveChangesAsync(); // need the Id before attaching messages
        }

        _context.ChatMessages.Add(new ChatMessage
        {
            ChatConversationId = conversation.Id,
            Role = "user",
            Content = dto.Message
        });

        try
        {
            var reply = await _aiProvider.GetCompletionAsync(dto.Message);

            _context.ChatMessages.Add(new ChatMessage
            {
                ChatConversationId = conversation.Id,
                Role = "ai",
                Content = reply
            });
            conversation.UpdatedAt = DateTime.UtcNow;

            if (!isPremium)
            {
                var usage = await _context.ChatUsages.FirstOrDefaultAsync(u => u.UserId == userId && u.Date == today);
                if (usage == null)
                {
                    usage = new ChatUsage { UserId = userId, Date = today, Count = 0 };
                    _context.ChatUsages.Add(usage);
                }
                usage.Count += 1;
            }

            await _context.SaveChangesAsync();

            return Ok(new ChatResponseDto { Reply = reply, ConversationId = conversation.Id });
        }
        catch (Exception ex)
        {
            await _context.SaveChangesAsync(); // still save the user's message even if the AI call failed
            return StatusCode(502, new { error = "AI service is currently unavailable", details = ex.Message });
        }
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage()
    {
        var userId = CurrentUserId;
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
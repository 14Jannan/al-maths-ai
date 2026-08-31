using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConversationsController(AppDbContext context)
    {
        _context = context;
    }

    private string CurrentUserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var conversations = await _context.ChatConversations
            .Where(c => c.UserId == CurrentUserId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new ConversationSummaryDto { Id = c.Id, Title = c.Title, UpdatedAt = c.UpdatedAt })
            .ToListAsync();

        return Ok(conversations);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var conversation = await _context.ChatConversations
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == CurrentUserId);

        if (conversation == null) return NotFound();

        return Ok(new ConversationDetailDto
        {
            Id = conversation.Id,
            Title = conversation.Title,
            Messages = conversation.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ChatMessageDto { Id = m.Id, Role = m.Role, Content = m.Content, CreatedAt = m.CreatedAt })
                .ToList()
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Rename(int id, RenameConversationDto dto)
    {
        var conversation = await _context.ChatConversations.FirstOrDefaultAsync(c => c.Id == id && c.UserId == CurrentUserId);
        if (conversation == null) return NotFound();

        conversation.Title = dto.Title;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var conversation = await _context.ChatConversations.FirstOrDefaultAsync(c => c.Id == id && c.UserId == CurrentUserId);
        if (conversation == null) return NotFound();

        _context.ChatConversations.Remove(conversation); // cascade removes its messages too
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
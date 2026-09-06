using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;
using Pgvector.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private const int FreeDailyLimit = 10;

    private readonly IAiProvider _aiProvider;
    private readonly AppDbContext _context;
    private readonly SupabaseStorageService _storageService;

    private readonly SyllabusRetrievalService _syllabusService;

    private readonly CohereEmbeddingService _embeddingService;

    public ChatController(IAiProvider aiProvider, AppDbContext context, SupabaseStorageService storageService, SyllabusRetrievalService syllabusService, CohereEmbeddingService embeddingService)
    {
        _aiProvider = aiProvider;
        _context = context;
        _storageService = storageService;
        _syllabusService = syllabusService;
        _embeddingService = embeddingService;
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

        // Load the recent history BEFORE adding the new AI reply, so the
        // model sees everything that happened up to (and including) this
        // user message, but not this call's own not-yet-generated reply.
        var recentHistory = await _context.ChatMessages
            .Where(m => m.ChatConversationId == conversation.Id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatTurn(m.Role, m.Content))
            .ToListAsync();

        _context.ChatMessages.Add(new ChatMessage
        {
            ChatConversationId = conversation.Id,
            Role = "user",
            Content = dto.Message
        });

        // Semantic search — embeddings catch related meaning even when the
        // exact words differ (e.g. a "rate of change" question still
        // matches a "differentiation" past paper question and a
        // "Differentiation basics" video). Done BEFORE the AI call (not
        // just after, for the UI links) so the top matching past paper's
        // real question + marking-scheme answer can ground the model's own
        // reply — the point of the MARKING SCHEME FORMAT rule in the
        // prompt. A failure here (e.g. the embedding API is briefly down)
        // shouldn't sink an otherwise-successful reply, so it's isolated
        // from the outer try/catch that guards the AI call itself.
        var relatedPapers = new List<RelatedPastPaperDto>();
        var relatedResources = new List<RelatedResourceDto>();
        var pastPaperReferenceContext = string.Empty;
        try
        {
            var questionEmbedding = await _embeddingService.GetEmbeddingAsync(dto.Message, "search_query");
            var questionVector = new Pgvector.Vector(questionEmbedding);

            // Full Q&A for the closest couple of matches — this is what
            // actually gets fed to the model as grounding, not just the
            // Id/Year/Paper shown as a link.
            var closestPapers = await _context.PastPapers
                .Where(p => p.Embedding != null)
                .OrderBy(p => p.Embedding!.CosineDistance(questionVector))
                .Take(2)
                .Select(p => new { p.Id, p.Year, p.Paper, p.QuestionNumber, p.QuestionText, p.Answer, p.Explanation })
                .ToListAsync();

            relatedPapers = closestPapers
                .Select(p => new RelatedPastPaperDto { Id = p.Id, Year = p.Year, Paper = p.Paper, QuestionNumber = p.QuestionNumber })
                .ToList();

            if (closestPapers.Count > 0)
            {
                pastPaperReferenceContext = string.Join("\n\n", closestPapers.Select(p =>
                    $"- {p.Year} {p.Paper} Q{p.QuestionNumber}: \"{p.QuestionText}\"\n  Marking scheme answer: {p.Answer}\n  Explanation: {p.Explanation}"));
            }

            relatedResources = await _context.Resources
                .Where(r => r.Embedding != null)
                .OrderBy(r => r.Embedding!.CosineDistance(questionVector))
                .Take(2)
                .Select(r => new RelatedResourceDto { Id = r.Id, Title = r.Title, Url = r.Url, SourceType = r.SourceType })
                .ToListAsync();
        }
        catch
        {
            // Related content is a bonus, not the point of the response —
            // fall through with whatever lists were already built rather
            // than failing the chat.
        }

        try
        {
            var syllabusContext = await _syllabusService.GetRelevantSyllabusContextAsync(dto.Message);
            if (!string.IsNullOrWhiteSpace(pastPaperReferenceContext))
            {
                syllabusContext += $"\n\nPAST PAPER REFERENCE (real questions with their official marking-scheme answers — cite one explicitly if it closely matches, and mirror its step/mark structure):\n{pastPaperReferenceContext}";
            }
            var reply = await _aiProvider.GetCompletionAsync(recentHistory, dto.Message, syllabusContext);

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

            return Ok(new ChatResponseDto { Reply = reply, ConversationId = conversation.Id, RelatedPastPapers = relatedPapers, RelatedResources = relatedResources });
        }
        catch (Exception ex)
        {
            await _context.SaveChangesAsync(); // still save the user's message even if the AI call failed
            return StatusCode(502, new { error = "AI service is currently unavailable", details = ex.Message });
        }
    }
    
        [HttpPost("image")]
    [RequestSizeLimit(10_000_000)] // 10 MB max per photo
    public async Task<IActionResult> SendImageMessage([FromForm] IFormFile image, [FromForm] string? message, [FromForm] int? conversationId)
    {
        if (image == null || image.Length == 0)
        {
            return BadRequest("No image uploaded");
        }

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(image.ContentType))
        {
            return BadRequest("Only JPEG, PNG, or WebP images are allowed");
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
                return StatusCode(429, new { error = "Daily free limit reached", limit = FreeDailyLimit });
            }
        }

        ChatConversation? conversation = null;
        if (conversationId.HasValue)
        {
            conversation = await _context.ChatConversations.FirstOrDefaultAsync(c => c.Id == conversationId.Value && c.UserId == userId);
        }
        if (conversation == null)
        {
            conversation = new ChatConversation { UserId = userId, Title = "Photo question" };
            _context.ChatConversations.Add(conversation);
            await _context.SaveChangesAsync();
        }

        string imageUrl;
        try
        {
            var extension = Path.GetExtension(image.FileName);
            if (string.IsNullOrWhiteSpace(extension)) extension = ".jpg";
            await using var stream = image.OpenReadStream();
            imageUrl = await _storageService.UploadQuestionImageAsync(userId, stream, image.ContentType, extension);
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = "Image upload failed", details = ex.Message });
        }

        // Store the image as a markdown-style image reference so the frontend can render it in the chat bubble
        var userContent = string.IsNullOrWhiteSpace(message)
            ? $"![question image]({imageUrl})"
            : $"![question image]({imageUrl})\n{message}";

        _context.ChatMessages.Add(new ChatMessage { ChatConversationId = conversation.Id, Role = "user", Content = userContent });

        try
        {
            var reply = await _aiProvider.GetVisionCompletionAsync(imageUrl, message ?? string.Empty);

            _context.ChatMessages.Add(new ChatMessage { ChatConversationId = conversation.Id, Role = "ai", Content = reply });
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

            return Ok(new ImageChatResponseDto { Reply = reply, ImageUrl = imageUrl, ConversationId = conversation.Id });
        }
        catch (Exception ex)
        {
            await _context.SaveChangesAsync();
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
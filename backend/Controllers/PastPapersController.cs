using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PastPapersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CohereEmbeddingService _embeddingService;

    public PastPapersController(AppDbContext context, CohereEmbeddingService embeddingService)
    {
        _context = context;
        _embeddingService = embeddingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? year, [FromQuery] int? topicId, [FromQuery] string? difficulty)
    {
        var query = _context.PastPapers.Include(p => p.MathTopic).AsQueryable();
        if (year.HasValue) query = query.Where(p => p.Year == year.Value);
        if (topicId.HasValue) query = query.Where(p => p.MathTopicId == topicId.Value);
        if (!string.IsNullOrWhiteSpace(difficulty)) query = query.Where(p => p.Difficulty == difficulty);

        var papers = await query.OrderByDescending(p => p.Year)
            .Select(p => new PastPaperDto
            {
                Id = p.Id, Year = p.Year, Paper = p.Paper, QuestionNumber = p.QuestionNumber,
                QuestionText = p.QuestionText, Answer = p.Answer, Explanation = p.Explanation,
                Difficulty = p.Difficulty, Language = p.Language, MathTopicId = p.MathTopicId,
                MathTopicName = p.MathTopic!.Name
            }).ToListAsync();

        return Ok(papers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var paper = await _context.PastPapers.Include(p => p.MathTopic).FirstOrDefaultAsync(p => p.Id == id);
        if (paper == null) return NotFound();

        return Ok(new PastPaperDto
        {
            Id = paper.Id, Year = paper.Year, Paper = paper.Paper, QuestionNumber = paper.QuestionNumber,
            QuestionText = paper.QuestionText, Answer = paper.Answer, Explanation = paper.Explanation,
            Difficulty = paper.Difficulty, Language = paper.Language, MathTopicId = paper.MathTopicId,
            MathTopicName = paper.MathTopic?.Name
        });
    }

    private async Task<Pgvector.Vector> ComputeEmbedding(PastPaperDto dto)
    {
        var text = $"{dto.QuestionText} {dto.Answer}";
        var embedding = await _embeddingService.GetEmbeddingAsync(text, "search_document");
        return new Pgvector.Vector(embedding);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(PastPaperDto dto)
    {
        var paper = new PastPaper
        {
            Year = dto.Year, Paper = dto.Paper, QuestionNumber = dto.QuestionNumber,
            QuestionText = dto.QuestionText, Answer = dto.Answer, Explanation = dto.Explanation,
            Difficulty = dto.Difficulty, Language = dto.Language, MathTopicId = dto.MathTopicId,
            Embedding = await ComputeEmbedding(dto)
        };

        _context.PastPapers.Add(paper);
        await _context.SaveChangesAsync();
        dto.Id = paper.Id;
        return CreatedAtAction(nameof(GetById), new { id = paper.Id }, dto);
    }

    // Add many past paper questions at once from a JSON array — e.g. after
    // manually typing up a batch of questions from a paper you have as a PDF.
    [HttpPost("bulk")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BulkCreate([FromBody] List<PastPaperDto> items)
    {
        var entities = new List<PastPaper>();
        foreach (var dto in items)
        {
            entities.Add(new PastPaper
            {
                Year = dto.Year, Paper = dto.Paper, QuestionNumber = dto.QuestionNumber,
                QuestionText = dto.QuestionText, Answer = dto.Answer, Explanation = dto.Explanation,
                Difficulty = dto.Difficulty, Language = dto.Language, MathTopicId = dto.MathTopicId,
                Embedding = await ComputeEmbedding(dto)
            });
        }
        _context.PastPapers.AddRange(entities);
        await _context.SaveChangesAsync();
        return Ok(new { added = entities.Count });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, PastPaperDto dto)
    {
        var paper = await _context.PastPapers.FindAsync(id);
        if (paper == null) return NotFound();

        paper.Year = dto.Year; paper.Paper = dto.Paper; paper.QuestionNumber = dto.QuestionNumber;
        paper.QuestionText = dto.QuestionText; paper.Answer = dto.Answer; paper.Explanation = dto.Explanation;
        paper.Difficulty = dto.Difficulty; paper.Language = dto.Language; paper.MathTopicId = dto.MathTopicId;
        paper.Embedding = await ComputeEmbedding(dto); // content changed — recompute

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var paper = await _context.PastPapers.FindAsync(id);
        if (paper == null) return NotFound();
        _context.PastPapers.Remove(paper);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Used internally by ChatController for semantic "related questions"
    [HttpGet("similar")]
    [Authorize]
    public async Task<IActionResult> FindSimilar([FromQuery] string q, [FromQuery] int topN = 3)
    {
        var embedding = await _embeddingService.GetEmbeddingAsync(q, "search_query");
        var vector = new Pgvector.Vector(embedding);

        var results = await _context.PastPapers
            .Where(p => p.Embedding != null)
            .OrderBy(p => p.Embedding!.CosineDistance(vector))
            .Take(topN)
            .Select(p => new { p.Id, p.Year, p.Paper, p.QuestionNumber })
            .ToListAsync();

        return Ok(results);
    }
}
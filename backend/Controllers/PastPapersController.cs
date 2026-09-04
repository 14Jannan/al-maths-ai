using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PastPapersController : ControllerBase
{
    private readonly AppDbContext _context;

    public PastPapersController(AppDbContext context)
    {
        _context = context;
    }

    // Supports optional filtering: /api/PastPapers?year=2023&topicId=1&difficulty=Hard
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? year,
        [FromQuery] int? topicId,
        [FromQuery] string? difficulty)
    {
        var query = _context.PastPapers.Include(p => p.MathTopic).AsQueryable();

        if (year.HasValue)
            query = query.Where(p => p.Year == year.Value);
        if (topicId.HasValue)
            query = query.Where(p => p.MathTopicId == topicId.Value);
        if (!string.IsNullOrWhiteSpace(difficulty))
            query = query.Where(p => p.Difficulty == difficulty);

        var papers = await query
            .OrderByDescending(p => p.Year)
            .Select(p => new PastPaperDto
            {
                Id = p.Id,
                Year = p.Year,
                Paper = p.Paper,
                QuestionNumber = p.QuestionNumber,
                QuestionText = p.QuestionText,
                Answer = p.Answer,
                Explanation = p.Explanation,
                Difficulty = p.Difficulty,
                Language = p.Language,
                MathTopicId = p.MathTopicId,
                MathTopicName = p.MathTopic!.Name
            })
            .ToListAsync();

        return Ok(papers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var paper = await _context.PastPapers.Include(p => p.MathTopic).FirstOrDefaultAsync(p => p.Id == id);
        if (paper == null) return NotFound();

        return Ok(new PastPaperDto
        {
            Id = paper.Id,
            Year = paper.Year,
            Paper = paper.Paper,
            QuestionNumber = paper.QuestionNumber,
            QuestionText = paper.QuestionText,
            Answer = paper.Answer,
            Explanation = paper.Explanation,
            Difficulty = paper.Difficulty,
            Language = paper.Language,
            MathTopicId = paper.MathTopicId,
            MathTopicName = paper.MathTopic?.Name
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(PastPaperDto dto)
    {
        var paper = new PastPaper
        {
            Year = dto.Year,
            Paper = dto.Paper,
            QuestionNumber = dto.QuestionNumber,
            QuestionText = dto.QuestionText,
            Answer = dto.Answer,
            Explanation = dto.Explanation,
            Difficulty = dto.Difficulty,
            Language = dto.Language,
            MathTopicId = dto.MathTopicId
        };

        _context.PastPapers.Add(paper);
        await _context.SaveChangesAsync();

        dto.Id = paper.Id;
        return CreatedAtAction(nameof(GetById), new { id = paper.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, PastPaperDto dto)
    {
        var paper = await _context.PastPapers.FindAsync(id);
        if (paper == null) return NotFound();

        paper.Year = dto.Year;
        paper.Paper = dto.Paper;
        paper.QuestionNumber = dto.QuestionNumber;
        paper.QuestionText = dto.QuestionText;
        paper.Answer = dto.Answer;
        paper.Explanation = dto.Explanation;
        paper.Difficulty = dto.Difficulty;
        paper.Language = dto.Language;
        paper.MathTopicId = dto.MathTopicId;
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
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExamPapersController : ControllerBase
{
    private readonly AppDbContext _context;

    public ExamPapersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? medium, [FromQuery] int? year)
    {
        var query = _context.ExamPaperDocuments.AsQueryable();
        if (!string.IsNullOrWhiteSpace(medium)) query = query.Where(e => e.Medium == medium);
        if (year.HasValue) query = query.Where(e => e.Year == year.Value);

        var results = await query
            .OrderByDescending(e => e.Year)
            .Select(e => new ExamPaperDocumentDto
            {
                Id = e.Id, Year = e.Year, Paper = e.Paper, Medium = e.Medium,
                QuestionPaperUrl = e.QuestionPaperUrl, MarkingSchemeUrl = e.MarkingSchemeUrl, SourceLabel = e.SourceLabel
            })
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(ExamPaperDocumentDto dto)
    {
        var entity = new ExamPaperDocument
        {
            Year = dto.Year, Paper = dto.Paper, Medium = dto.Medium,
            QuestionPaperUrl = dto.QuestionPaperUrl, MarkingSchemeUrl = dto.MarkingSchemeUrl, SourceLabel = dto.SourceLabel
        };
        _context.ExamPaperDocuments.Add(entity);
        await _context.SaveChangesAsync();
        dto.Id = entity.Id;
        return Ok(dto);
    }

    // Add many at once — this is the one you'll use once the verified
    // year/medium link list is ready, instead of adding 40 one at a time.
    [HttpPost("bulk")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BulkCreate(BulkExamPaperDto dto)
    {
        var entities = dto.Items.Select(i => new ExamPaperDocument
        {
            Year = i.Year, Paper = i.Paper, Medium = i.Medium,
            QuestionPaperUrl = i.QuestionPaperUrl, MarkingSchemeUrl = i.MarkingSchemeUrl, SourceLabel = i.SourceLabel
        }).ToList();

        _context.ExamPaperDocuments.AddRange(entities);
        await _context.SaveChangesAsync();
        return Ok(new { added = entities.Count });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _context.ExamPaperDocuments.FindAsync(id);
        if (entity == null) return NotFound();
        _context.ExamPaperDocuments.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
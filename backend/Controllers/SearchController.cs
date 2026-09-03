using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _context;

    public SearchController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
        {
            return Ok(new SearchResultDto());
        }

        var query = q.Trim();
        const int maxPerGroup = 5;

        var topics = await _context.MathTopics
            .Where(t => EF.Functions.ILike(t.Name, $"%{query}%") || EF.Functions.ILike(t.Description, $"%{query}%"))
            .Take(maxPerGroup)
            .Select(t => new SearchItemDto { Id = t.Id, Title = t.Name, Subtitle = t.Description })
            .ToListAsync();

        var papers = await _context.PastPapers
            .Where(p => EF.Functions.ILike(p.QuestionText, $"%{query}%"))
            .Take(maxPerGroup)
            .Select(p => new SearchItemDto { Id = p.Id, Title = $"{p.Year} \u00b7 {p.Paper} \u00b7 Q{p.QuestionNumber}", Subtitle = p.QuestionText })
            .ToListAsync();

        var resources = await _context.Resources
            .Where(r => EF.Functions.ILike(r.Title, $"%{query}%"))
            .Take(maxPerGroup)
            .Select(r => new SearchItemDto { Id = r.Id, Title = r.Title, Subtitle = r.SourceType })
            .ToListAsync();

        return Ok(new SearchResultDto { Topics = topics, Papers = papers, Resources = resources });
    }
}
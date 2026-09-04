using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;

namespace backend.Controllers;

// Public (no auth) — feeds real numbers to the logged-out landing page,
// which has no token to call the admin-only /api/Admin/overview with.
[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StatsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPublicStats()
    {
        var topicsCount = await _context.MathTopics.CountAsync();

        var years = await _context.ExamPaperDocuments.Select(e => e.Year).Distinct().ToListAsync();
        var yearsCovered = years.Count > 0 ? years.Max() - years.Min() + 1 : 0;

        return Ok(new PublicStatsDto
        {
            TopicsCount = topicsCount,
            YearsCovered = yearsCovered
        });
    }
}

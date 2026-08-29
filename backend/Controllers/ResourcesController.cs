using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResourcesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? topicId)
    {
        var query = _context.Resources.Include(r => r.MathTopic).AsQueryable();
        if (topicId.HasValue)
            query = query.Where(r => r.MathTopicId == topicId.Value);

        var resources = await query
            .Select(r => new ResourceDto
            {
                Id = r.Id,
                Title = r.Title,
                Url = r.Url,
                SourceType = r.SourceType,
                MathTopicId = r.MathTopicId,
                MathTopicName = r.MathTopic!.Name
            })
            .ToListAsync();

        return Ok(resources);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(ResourceDto dto)
    {
        var resource = new Resource
        {
            Title = dto.Title,
            Url = dto.Url,
            SourceType = dto.SourceType,
            MathTopicId = dto.MathTopicId
        };

        _context.Resources.Add(resource);
        await _context.SaveChangesAsync();

        dto.Id = resource.Id;
        return CreatedAtAction(nameof(GetAll), new { id = resource.Id }, dto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null) return NotFound();

        _context.Resources.Remove(resource);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
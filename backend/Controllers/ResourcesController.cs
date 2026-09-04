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
public class ResourcesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CohereEmbeddingService _embeddingService;

    public ResourcesController(AppDbContext context, CohereEmbeddingService embeddingService)
    {
        _context = context;
        _embeddingService = embeddingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? topicId, [FromQuery] string? language, [FromQuery] string? branch)
    {
        var query = _context.Resources.Include(r => r.MathTopic).AsQueryable();
        if (topicId.HasValue)
            query = query.Where(r => r.MathTopicId == topicId.Value);
        if (!string.IsNullOrWhiteSpace(language))
            query = query.Where(r => r.Language == language);
        if (!string.IsNullOrWhiteSpace(branch))
            query = query.Where(r => r.Branch == branch);

        var resources = await query
            .Select(r => new ResourceDto
            {
                Id = r.Id,
                Title = r.Title,
                Url = r.Url,
                SourceType = r.SourceType,
                Language = r.Language,
                Branch = r.Branch,
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
            Language = dto.Language,
            Branch = dto.Branch,
            MathTopicId = dto.MathTopicId
        };

        var embedding = await _embeddingService.GetEmbeddingAsync(dto.Title, "search_document");
        resource.Embedding = new Pgvector.Vector(embedding);

        _context.Resources.Add(resource);
        await _context.SaveChangesAsync();

        dto.Id = resource.Id;
        return CreatedAtAction(nameof(GetAll), new { id = resource.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, ResourceDto dto)
    {
        var resource = await _context.Resources.FindAsync(id);
        if (resource == null) return NotFound();

        var titleChanged = resource.Title != dto.Title;

        resource.Title = dto.Title;
        resource.Url = dto.Url;
        resource.SourceType = dto.SourceType;
        resource.Language = dto.Language;
        resource.Branch = dto.Branch;
        resource.MathTopicId = dto.MathTopicId;

        if (titleChanged)
        {
            var embedding = await _embeddingService.GetEmbeddingAsync(dto.Title, "search_document");
            resource.Embedding = new Pgvector.Vector(embedding);
        }

        await _context.SaveChangesAsync();
        return NoContent();
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

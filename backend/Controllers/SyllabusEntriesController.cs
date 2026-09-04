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
public class SyllabusEntriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly CohereEmbeddingService _embeddingService;

    public SyllabusEntriesController(AppDbContext context, CohereEmbeddingService embeddingService)
    {
        _context = context;
        _embeddingService = embeddingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var entries = await _context.SyllabusEntries
            .OrderBy(e => e.Paper).ThenBy(e => e.Topic)
            .Select(e => new SyllabusEntryDto { Id = e.Id, Topic = e.Topic, Paper = e.Paper, Content = e.Content, Keywords = e.Keywords })
            .ToListAsync();
        return Ok(entries);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(SyllabusEntryDto dto)
    {
        var embedding = await _embeddingService.GetEmbeddingAsync($"{dto.Topic}: {dto.Content}", "search_document");
        var entry = new SyllabusEntry
        {
            Topic = dto.Topic, Paper = dto.Paper, Content = dto.Content, Keywords = dto.Keywords,
            Embedding = new Pgvector.Vector(embedding)
        };
        _context.SyllabusEntries.Add(entry);
        await _context.SaveChangesAsync();
        dto.Id = entry.Id;
        return Ok(dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, SyllabusEntryDto dto)
    {
        var entry = await _context.SyllabusEntries.FindAsync(id);
        if (entry == null) return NotFound();

        entry.Topic = dto.Topic;
        entry.Paper = dto.Paper;
        entry.Content = dto.Content;
        entry.Keywords = dto.Keywords;

        // Content changed — the embedding must be recomputed, otherwise
        // search would keep matching on the OLD meaning of this entry.
        var embedding = await _embeddingService.GetEmbeddingAsync($"{dto.Topic}: {dto.Content}", "search_document");
        entry.Embedding = new Pgvector.Vector(embedding);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await _context.SyllabusEntries.FindAsync(id);
        if (entry == null) return NotFound();
        _context.SyllabusEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
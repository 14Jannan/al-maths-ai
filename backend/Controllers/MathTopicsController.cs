using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MathTopicsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MathTopicsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var topics = await _context.MathTopics
            .Select(t => new MathTopicDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Branch = t.Branch
            })
            .ToListAsync();

        return Ok(topics);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var topic = await _context.MathTopics.FindAsync(id);
        if (topic == null)
        {
            return NotFound();
        }

        return Ok(new MathTopicDto
        {
            Id = topic.Id,
            Name = topic.Name,
            Description = topic.Description,
            Branch = topic.Branch
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(MathTopicDto dto)
    {
        var topic = new MathTopic
        {
            Name = dto.Name,
            Description = dto.Description,
            Branch = dto.Branch
        };

        _context.MathTopics.Add(topic);
        await _context.SaveChangesAsync();

        dto.Id = topic.Id;
        return CreatedAtAction(nameof(GetById), new { id = topic.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, MathTopicDto dto)
    {
        var topic = await _context.MathTopics.FindAsync(id);
        if (topic == null)
        {
            return NotFound();
        }

        topic.Name = dto.Name;
        topic.Description = dto.Description;
        topic.Branch = dto.Branch;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var topic = await _context.MathTopics.FindAsync(id);
        if (topic == null)
        {
            return NotFound();
        }

        _context.MathTopics.Remove(topic);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
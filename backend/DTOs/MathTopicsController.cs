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
                Description = t.Description
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
            Description = topic.Description
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(MathTopicDto dto)
    {
        var topic = new MathTopic
        {
            Name = dto.Name,
            Description = dto.Description
        };

        _context.MathTopics.Add(topic);
        await _context.SaveChangesAsync();

        dto.Id = topic.Id;
        return CreatedAtAction(nameof(GetById), new { id = topic.Id }, dto);
    }
}
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IAiProvider _aiProvider;

    public ChatController(IAiProvider aiProvider)
    {
        _aiProvider = aiProvider;
    }

    [HttpPost]
    [HttpPost]
public async Task<IActionResult> SendMessage(ChatRequestDto dto)
{
    if (string.IsNullOrWhiteSpace(dto.Message))
    {
        return BadRequest("Message cannot be empty");
    }

    try
    {
        var reply = await _aiProvider.GetCompletionAsync(dto.Message);
        return Ok(new ChatResponseDto { Reply = reply });
    }
    catch (Exception ex)
    {
        return StatusCode(502, new { error = "AI service is currently unavailable", details = ex.Message });
    }
}
}
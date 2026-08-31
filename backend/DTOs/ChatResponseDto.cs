namespace backend.DTOs;

public class ChatResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public int ConversationId { get; set; } // so the frontend knows which conversation this belongs to
}
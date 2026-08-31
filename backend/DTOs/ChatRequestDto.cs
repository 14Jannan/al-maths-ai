namespace backend.DTOs;

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public int? ConversationId { get; set; } // null = start a new conversation
}
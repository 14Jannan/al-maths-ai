namespace backend.DTOs;

public class ImageChatResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int ConversationId { get; set; }
}
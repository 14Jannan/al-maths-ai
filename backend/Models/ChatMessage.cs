namespace backend.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public int ChatConversationId { get; set; }
    public ChatConversation? ChatConversation { get; set; }

    public string Role { get; set; } = string.Empty; // "user" or "ai"
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
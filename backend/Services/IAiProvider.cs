namespace backend.Services;

public record ChatTurn(string Role, string Content); // "user" or "ai"

public interface IAiProvider
{
    Task<string> GetCompletionAsync(List<ChatTurn> history, string userMessage, string syllabusContext);
    Task<string> GetVisionCompletionAsync(string imageUrl, string userMessage);
}
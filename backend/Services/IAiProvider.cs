namespace backend.Services;

public record ChatTurn(string Role, string Content);

public interface IAiProvider
{
    Task<string> GetCompletionAsync(List<ChatTurn> history, string userMessage, string syllabusContext);
    Task<string> GetVisionCompletionAsync(string imageUrl, string userMessage, string ragContext = "");
    Task<string> ExtractTextFromImageAsync(string imageUrl);
}
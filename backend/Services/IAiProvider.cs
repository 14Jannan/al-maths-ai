namespace backend.Services;

public interface IAiProvider
{
    Task<string> GetCompletionAsync(string userMessage);
    Task<string> GetVisionCompletionAsync(string imageUrl, string userMessage);
}
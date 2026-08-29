namespace backend.Services;

public interface IAiProvider
{
    Task<string> GetCompletionAsync(string userMessage);
}
using System.Text;
using System.Text.Json;

namespace backend.Services;

public class CohereEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public CohereEmbeddingService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    // inputType is "search_document" when embedding syllabus content to store,
    // or "search_query" when embedding a student's question — Cohere's model
    // is trained to treat these slightly differently for better retrieval.
    public async Task<float[]> GetEmbeddingAsync(string text, string inputType)
    {
        var apiKey = _configuration["Cohere:ApiKey"];

        var requestBody = new
        {
            model = "embed-multilingual-v3.0", // supports both English and Tamil text
            texts = new[] { text },
            input_type = inputType,
            embedding_types = new[] { "float" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.cohere.com/v1/embed");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Cohere API error ({response.StatusCode}): {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);
        var embeddingArray = doc.RootElement.GetProperty("embeddings").GetProperty("float")[0];

        var embedding = new float[embeddingArray.GetArrayLength()];
        for (int i = 0; i < embedding.Length; i++)
        {
            embedding[i] = embeddingArray[i].GetSingle();
        }
        return embedding;
    }
}
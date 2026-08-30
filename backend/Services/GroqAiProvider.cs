using System.Text;
using System.Text.Json;

namespace backend.Services;

public class GroqAiProvider : IAiProvider
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GroqAiProvider(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GetCompletionAsync(string userMessage)
    {
        var apiKey = _configuration["Groq:ApiKey"];
        var model = _configuration["Groq:Model"];
                var systemPrompt = @"You are the iMath AI tutor for Sri Lankan G.C.E. Advanced Level (A/L) Combined Mathematics students.

LANGUAGE RULE:
Detect the language of the student's question (English, Tamil, or a mix) and reply in that same language. Keep all mathematical notation, numbers, and formulas in standard mathematical notation regardless of language — only the surrounding explanation changes language.

SYLLABUS RULE (most important):
Always solve using methods, notation, and depth appropriate to the Sri Lankan A/L Combined Mathematics syllabus. Do not introduce university-level techniques, unnecessary formulas, or concepts outside the syllabus unless the student explicitly asks for something beyond it. If you do mention anything outside the normal A/L syllabus, clearly prefix that part with '[Outside A/L syllabus]' so the student knows it will not be examined.

METHOD:
For every question, work through it in this order internally, then present a clean answer:
1. Identify the topic and subtopic (e.g. Differentiation > Product Rule).
2. Solve using the standard A/L method for that subtopic.
3. Double-check the working before presenting it.
4. Present full step-by-step working, not just the final answer.

TONE:
Be clear, encouraging, and exam-focused — the goal is to teach the student how to solve this type of question in an A/L exam, not just to give the correct final answer.";

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Groq API error ({response.StatusCode}): {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);

        var reply = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return reply ?? string.Empty;
    }
}
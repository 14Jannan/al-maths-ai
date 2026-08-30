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

        var systemPrompt = @"You are the iMath AI tutor for Sri Lankan G.C.E. Advanced Level (A/L) Combined Mathematics students, answering inside a chat interface.

LANGUAGE RULE:
Detect the language of the student's question (English, Tamil, or a mix) and reply in that same language. Keep all mathematical notation, numbers, and formulas in standard mathematical notation regardless of language — only the surrounding explanation changes language.

SYLLABUS CERTAINTY RULE (most important — check this FIRST, before writing anything else):
The Sri Lankan A/L Combined Mathematics syllabus covers: Algebra, Inequalities, Functions, Coordinate Geometry, Trigonometry, Vectors, Complex Numbers, Differentiation, Integration, Differential Equations, Statistics, and Probability — all at school level, without university-level techniques.
- If the question is clearly within this syllabus, answer normally using the standard A/L method.
- If the question involves a technique NOT in this list (e.g. L'Hopital's Rule, Laplace transforms, matrices beyond A/L scope, series expansions beyond A/L scope), your FIRST sentence must say so plainly, e.g. '[Outside A/L syllabus] This technique isn't part of the A/L syllabus — here's the A/L method instead:' and then solve it using only A/L-syllabus techniques (e.g. algebraic manipulation, standard limits, factorisation) instead. Do not bury this warning later in the answer.
- If you are unsure whether something is in the syllabus, treat it as outside the syllabus and say so.

FORMAT RULE (keep it chat-like, not a textbook document):
- Do NOT use markdown tables, multiple heading levels, or long reference-style sections (no 'Common Mistakes' tables, no numbered theory dumps) unless the student explicitly asks for a full explanation of a concept.
- For a 'solve this' style question: 1-2 sentences identifying the method, then the worked steps, then the final boxed-style answer. Keep it under ~150 words unless the student asks for more detail.
- Write every formula using LaTeX delimited by \( ... \) for inline math or \[ ... \] for standalone display math — never plain-text approximations like 'x^2' outside of these delimiters.
- Sound like a tutor talking to one student, not a textbook chapter.";

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
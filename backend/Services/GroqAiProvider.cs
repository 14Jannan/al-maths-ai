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

    public async Task<string> GetCompletionAsync(List<ChatTurn> history, string userMessage, string syllabusContext)
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
- Sound like a tutor talking to one student, not a textbook chapter.

MARKING SCHEME FORMAT RULE (only for a specific, solvable exam-style problem — not for open concept questions like 'what is differentiation'):
- Break the working into the same step units a Sri Lankan A/L marker would award, and label each one inline: M1 for a correct method/setup step, A1 for a correct accuracy/simplification step, B1 for a stated fact/result used without derivation. Number them in order, e.g. 'Step 1 (M1): ...', 'Step 2 (A1): ...'.
- End with the final answer clearly marked, and the total, e.g. 'Final Answer (A1) — total: 3 marks' — only state a total if you're confident in the mark count; otherwise omit the total rather than guess.
- This mirrors how the official marking scheme would grade the question, so the student can self-check exactly where marks are gained or lost — it is not extra decoration, keep it as terse as the rest of your answer.

CONTEXT RULE:
Earlier messages in this conversation are provided for context. Refer back to them naturally if the student asks a follow-up (e.g. 'what about part b', 'explain that step again') instead of treating each message as unrelated.";
        if (!string.IsNullOrWhiteSpace(syllabusContext))
        {
            systemPrompt += $@"

            OFFICIAL SYLLABUS REFERENCE (authoritative — use this to decide what is/isn't in scope):
            {syllabusContext}

            If the student's question relates to a technique not mentioned in the reference above, treat it as outside the A/L syllabus per the SYLLABUS CERTAINTY RULE.
            If a PAST PAPER REFERENCE section is included above, and it closely matches the student's question, mention which paper/question it is (e.g. '2022 Paper II Q5(b)') so the student can look it up, and structure your steps the same way its marking scheme answer does.";
        }

        var messages = new List<object> { new { role = "system", content = systemPrompt } };

        // Include recent conversation history so the AI has memory of this chat.
        // Capped to the last 10 turns to keep token usage and cost reasonable —
        // very long conversations don't need the full history for context to work.
        foreach (var turn in history.TakeLast(10))
        {
            messages.Add(new { role = turn.Role == "ai" ? "assistant" : "user", content = turn.Content });
        }
        messages.Add(new { role = "user", content = userMessage });

        var requestBody = new { model = model, messages = messages };

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
    public async Task<string> ExtractTextFromImageAsync(string imageUrl)
    {
        var apiKey = _configuration["Groq:ApiKey"];
        var visionModel = "qwen/qwen3.8-27b";

        var requestBody = new
        {
            model = visionModel,
            max_tokens = 800, // stay under Groq's free-tier output-token-per-minute cap
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You transcribe mathematics exam questions from photos. Read the image carefully and output ONLY the exact question text as written, preserving all mathematical notation using LaTeX delimited by \\( ... \\) for inline math or \\[ ... \\] for display math. If there are multiple sub-questions (a), (b), (c) etc., transcribe all of them in order. Do NOT solve the question, do NOT add any explanation, do NOT add commentary \u2014 output only the transcribed question text. Keep the transcription concise \u2014 do not repeat the question."
                },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = "Transcribe the question(s) in this image." },
                        new { type = "image_url", image_url = new { url = imageUrl } }
                    }
                }
            }
        };

        // Groq's free tier has a per-minute token budget. When processing
        // many pages back-to-back (e.g. a 69-page scanned PDF), we will hit
        // that limit partway through. Rather than fail the whole batch,
        // retry with the wait time the API itself tells us to use.
        const int maxRetries = 5;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                // Parse "try again in 18.04s" from the error message, or fall back to a fixed wait
                var waitSeconds = 20.0;
                var match = System.Text.RegularExpressions.Regex.Match(responseBody, @"try again in ([\d.]+)s");
                if (match.Success && double.TryParse(match.Groups[1].Value, out var parsed))
                {
                    waitSeconds = parsed + 1; // add a 1s safety margin
                }

                if (attempt == maxRetries)
                {
                    throw new Exception($"Groq vision API rate limit persisted after {maxRetries} attempts: {responseBody}");
                }

                await Task.Delay(TimeSpan.FromSeconds(waitSeconds));
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Groq vision API error ({response.StatusCode}): {responseBody}");
            }

            using var doc = JsonDocument.Parse(responseBody);
            var text = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            return text ?? string.Empty;
        }

        throw new Exception("Unreachable"); // satisfies compiler; loop always returns or throws
    }

    public async Task<string> GetVisionCompletionAsync(string imageUrl, string userMessage, string ragContext = "")
    {
        var apiKey = _configuration["Groq:ApiKey"];
        var visionModel = "qwen/qwen3.8-27b";

        var systemPrompt = "You are the iMath AI tutor for Sri Lankan A/L Combined Mathematics students. A student has uploaded a photo of a question. Read the question from the image carefully, then solve it using the standard A/L method, showing full working. If the image is unclear or not a maths question, say so clearly instead of guessing."
            + " Write every formula using LaTeX delimited by \\( ... \\) for inline math or \\[ ... \\] for standalone display math."
            + " MARKING SCHEME FORMAT: for a specific solvable problem, break the working into the same step units a Sri Lankan A/L marker would award — M1 for a correct method/setup step, A1 for a correct accuracy/simplification step, B1 for a stated fact used without derivation — labelling each step inline (e.g. 'Step 1 (M1): ...'), and mark the final answer clearly.";
        if (!string.IsNullOrWhiteSpace(ragContext))
        {
            systemPrompt += $"\n\n{ragContext}\n\nIf a PAST PAPER REFERENCE above closely matches this question, mention which paper/question it is and mirror its marking-scheme structure.";
        }

        var requestBody = new
        {
            model = visionModel,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = string.IsNullOrWhiteSpace(userMessage) ? "Please solve this question." : userMessage },
                        new { type = "image_url", image_url = new { url = imageUrl } }
                    }
                }
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
            throw new Exception($"Groq vision API error ({response.StatusCode}): {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);
        var reply = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        return reply ?? string.Empty;
    }
}   
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;
using backend.Data;

namespace backend.Services;

public class SyllabusRetrievalService
{
    private readonly AppDbContext _context;
    private readonly CohereEmbeddingService _embeddingService;

    public SyllabusRetrievalService(AppDbContext context, CohereEmbeddingService embeddingService)
    {
        _context = context;
        _embeddingService = embeddingService;
    }

    public async Task<string> GetRelevantSyllabusContextAsync(string question, int topN = 3)
    {
        var queryEmbedding = await _embeddingService.GetEmbeddingAsync(question, "search_query");
        var queryVector = new Pgvector.Vector(queryEmbedding);

        // CosineDistance: 0 = identical meaning, 2 = opposite meaning.
        // Ordering ascending gives the most semantically relevant entries first.
        var entries = await _context.SyllabusEntries
            .Where(e => e.Embedding != null)
            .OrderBy(e => e.Embedding!.CosineDistance(queryVector))
            .Take(topN)
            .ToListAsync();

        if (entries.Count == 0)
        {
            return string.Empty;
        }

        var lines = entries.Select(e => $"- {e.Topic} ({e.Paper}): {e.Content}");
        return string.Join("\n", lines);
    }
}
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

        var syllabusEntries = await _context.SyllabusEntries
            .Where(e => e.Embedding != null)
            .OrderBy(e => e.Embedding!.CosineDistance(queryVector))
            .Take(topN)
            .Select(e => $"- [Official syllabus] {e.Topic} ({e.Paper}): {e.Content}")
            .ToListAsync();

        // Search uploaded document chunks too (admin-uploaded notes/materials),
        // clearly labelled so the AI knows this came from supplementary
        // material rather than the official syllabus itself.
        var documentChunks = await _context.DocumentChunks
            .Where(d => d.Embedding != null)
            .OrderBy(d => d.Embedding!.CosineDistance(queryVector))
            .Take(topN)
            .Select(d => $"- [From uploaded material \"{d.SourceTitle}\"]: {d.ChunkText}")
            .ToListAsync();

        var all = syllabusEntries.Concat(documentChunks).ToList();
        return all.Count == 0 ? string.Empty : string.Join("\n", all);
    }
}
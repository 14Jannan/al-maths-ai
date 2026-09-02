using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Services;

public class SyllabusRetrievalService
{
    private readonly AppDbContext _context;

    public SyllabusRetrievalService(AppDbContext context)
    {
        _context = context;
    }

    // Simple keyword-overlap scoring: not true semantic search, but effective
    // for a fixed set of ~35 well-labelled topics. Each entry's Topic and
    // Keywords fields are checked against the question text; the more words
    // that appear, the more relevant the entry is assumed to be.
    public async Task<string> GetRelevantSyllabusContextAsync(string question, int topN = 3)
    {
        var entries = await _context.SyllabusEntries.ToListAsync();
        var questionLower = question.ToLowerInvariant();

        var scored = entries
            .Select(e =>
            {
                var keywordList = e.Keywords.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                var score = keywordList.Count(k => questionLower.Contains(k.ToLowerInvariant()));
                if (questionLower.Contains(e.Topic.ToLowerInvariant())) score += 2;
                return (Entry: e, Score: score);
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(topN)
            .ToList();

        if (scored.Count == 0)
        {
            return string.Empty;
        }

        var lines = scored.Select(x => $"- {x.Entry.Topic} ({x.Entry.Paper}): {x.Entry.Content}");
        return string.Join("\n", lines);
    }
}
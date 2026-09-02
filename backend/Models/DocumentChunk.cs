using Pgvector;

namespace backend.Models;

public class DocumentChunk
{
    public int Id { get; set; }
    public string SourceTitle { get; set; } = string.Empty; // e.g. "Differentiation Notes.pdf"
    public string ChunkText { get; set; } = string.Empty;
    public int ChunkIndex { get; set; } // order within the source document
    public int? MathTopicId { get; set; } // optional tag for filtering/browsing
    public Vector? Embedding { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
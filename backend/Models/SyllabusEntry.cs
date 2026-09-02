using Pgvector;

namespace backend.Models;

public class SyllabusEntry
{
    public int Id { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string Paper { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
    public Vector? Embedding { get; set; } // 1024 dimensions (Cohere embed-multilingual-v3.0)
}
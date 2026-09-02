namespace backend.DTOs;

public class DocumentSummaryDto
{
    public string SourceTitle { get; set; } = string.Empty;
    public int ChunkCount { get; set; }
    public DateTime UploadedAt { get; set; }
}
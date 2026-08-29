namespace backend.DTOs;

public class ResourceDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public int MathTopicId { get; set; }
    public string? MathTopicName { get; set; }
}
namespace backend.Models;

public class Resource
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string SourceType { get; set; } = "YouTube";
    public string Language { get; set; } = "English"; // "English" or "Tamil"
    public int MathTopicId { get; set; }
    public MathTopic? MathTopic { get; set; }
}
using Pgvector;

namespace backend.Models;

public class PastPaper
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Paper { get; set; } = string.Empty;
    public string QuestionNumber { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string? QuestionImageUrl { get; set; } // diagram/graph photo, when the question has one
    public string Answer { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Medium";
    public string Language { get; set; } = "English";
    public int MathTopicId { get; set; }
    public MathTopic? MathTopic { get; set; }
    public Vector? Embedding { get; set; }
}
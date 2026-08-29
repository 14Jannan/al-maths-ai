namespace backend.DTOs;

public class PastPaperDto
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Paper { get; set; } = string.Empty;
    public string QuestionNumber { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Medium";
    public string Language { get; set; } = "English";

    public int MathTopicId { get; set; }
    public string? MathTopicName { get; set; }
}

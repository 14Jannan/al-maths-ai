namespace backend.Models;

public class PastPaper
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Paper { get; set; } = string.Empty;          // e.g. "Paper I", "Paper II"
    public string QuestionNumber { get; set; } = string.Empty; // e.g. "3(a)"
    public string QuestionText { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Medium";         // Easy / Medium / Hard
    public string Language { get; set; } = "English";          // English / Tamil

    public int MathTopicId { get; set; }
    public MathTopic? MathTopic { get; set; }
}
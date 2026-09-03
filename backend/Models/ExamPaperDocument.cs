namespace backend.Models;

public class ExamPaperDocument
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Paper { get; set; } = string.Empty;   // "Paper I" / "Paper II" / "Combined"
    public string Medium { get; set; } = string.Empty;   // "English" / "Tamil"
    public string QuestionPaperUrl { get; set; } = string.Empty;
    public string? MarkingSchemeUrl { get; set; }
    public string SourceLabel { get; set; } = string.Empty; // e.g. "Past Papers WiKi" - for attribution
}
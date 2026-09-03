namespace backend.DTOs;

public class ExamPaperDocumentDto
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Paper { get; set; } = string.Empty;
    public string Medium { get; set; } = string.Empty;
    public string QuestionPaperUrl { get; set; } = string.Empty;
    public string? MarkingSchemeUrl { get; set; }
    public string SourceLabel { get; set; } = string.Empty;
}

// For adding many at once, e.g. from a compiled research list
public class BulkExamPaperDto
{
    public List<ExamPaperDocumentDto> Items { get; set; } = new();
}
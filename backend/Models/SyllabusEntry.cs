namespace backend.Models;

public class SyllabusEntry
{
    public int Id { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string Paper { get; set; } = string.Empty; // "Combined Maths I" or "Combined Maths II"
    public string Content { get; set; } = string.Empty; // official syllabus description, condensed
    public string Keywords { get; set; } = string.Empty; // comma-separated, for matching
}
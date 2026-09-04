namespace backend.DTOs;

public class SyllabusEntryDto
{
    public int Id { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string Paper { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
}
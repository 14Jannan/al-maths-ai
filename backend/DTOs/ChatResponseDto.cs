namespace backend.DTOs;

public class ChatResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public int ConversationId { get; set; }
    public List<RelatedPastPaperDto> RelatedPastPapers { get; set; } = new();
    public List<RelatedResourceDto> RelatedResources { get; set; } = new();
}

public class RelatedPastPaperDto
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Paper { get; set; } = string.Empty;
    public string QuestionNumber { get; set; } = string.Empty;
}

public class RelatedResourceDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
}

namespace backend.DTOs;

public class ImageChatResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int ConversationId { get; set; }
    public List<RelatedPastPaperDto> RelatedPastPapers { get; set; } = new();
    public List<RelatedResourceDto> RelatedResources { get; set; } = new();
    public List<RelatedDiagramDto> RelatedDiagrams { get; set; } = new();
}
namespace backend.DTOs;

public class SearchResultDto
{
    public List<SearchItemDto> Topics { get; set; } = new();
    public List<SearchItemDto> Papers { get; set; } = new();
    public List<SearchItemDto> Resources { get; set; } = new();
}

public class SearchItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
}
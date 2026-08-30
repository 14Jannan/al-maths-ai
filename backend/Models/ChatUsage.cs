namespace backend.Models;

public class ChatUsage
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public int Count { get; set; }
}
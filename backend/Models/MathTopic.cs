namespace backend.Models;

public class MathTopic
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Branch { get; set; } = "Pure"; // "Pure" or "Applied"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
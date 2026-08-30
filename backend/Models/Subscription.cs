namespace backend.Models;

public class Subscription
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Status { get; set; } = "Free";      // Free / Active / Cancelled / Expired
    public DateTime? StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? PayHereOrderId { get; set; }
}
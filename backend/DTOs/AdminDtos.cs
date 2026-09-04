namespace backend.DTOs;

public class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int AdminCount { get; set; }
    public int PremiumSubscribers { get; set; }
    public int TopicsCount { get; set; }
    public int PastPaperQuestionsCount { get; set; }
    public int ResourcesCount { get; set; }
    public int ExamPaperDocumentsCount { get; set; }
    public int DocumentChunksCount { get; set; }
    public int ChatMessagesToday { get; set; }
    public int NewUsersThisWeek { get; set; }
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsPremium { get; set; }
    public string? SubscriptionExpiresAt { get; set; }
}

public class SetRoleDto
{
    public bool IsAdmin { get; set; }
}
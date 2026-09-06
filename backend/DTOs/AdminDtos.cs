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
    public string UserName { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsPremium { get; set; }
    public string? SubscriptionExpiresAt { get; set; }
}

// One combined "edit user" save — details + role together, so the admin
// table's Edit action doesn't need a separate Make-Admin control.
public class UpdateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

// Backs the three Overview charts — all computed from real rows (user
// CreatedAt, Subscriptions, ChatMessages), never mocked.
public class AdminAnalyticsDto
{
    public List<UserGrowthPointDto> UserGrowth { get; set; } = new();
    public List<TopicUsageDto> MostAskedTopics { get; set; } = new();
    public int FreeUsers { get; set; }
    public int PremiumUsers { get; set; }
}

public class UserGrowthPointDto
{
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public int NewUsers { get; set; }
    public int CumulativeUsers { get; set; }
}

public class TopicUsageDto
{
    public string Topic { get; set; } = string.Empty;
    public int MentionCount { get; set; }
}
namespace backend.DTOs;

public class VerifyOtpDto
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class ResendOtpDto
{
    public string Email { get; set; } = string.Empty;
}

public class RegisterResponseDto
{
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
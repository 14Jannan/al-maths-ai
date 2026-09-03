using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace backend.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendOtpEmailAsync(string toEmail, string code)
    {
        var fromEmail = _configuration["Gmail:Email"]!;
        var appPassword = _configuration["Gmail:AppPassword"]!;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("iMath", fromEmail));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = "Your iMath verification code";

        message.Body = new TextPart("plain")
        {
            Text = $"Your iMath verification code is: {code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, you can ignore this email."
        };

        using var client = new SmtpClient();
        await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(fromEmail, appPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
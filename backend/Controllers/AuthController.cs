using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly EmailService _emailService;
    private readonly AppDbContext _context;

    public AuthController(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        TokenService tokenService,
        EmailService emailService,
        AppDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _context = context;
    }

    private static string GenerateOtpCode() => Random.Shared.Next(100000, 999999).ToString();

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user = new IdentityUser { UserName = dto.Email, Email = dto.Email, EmailConfirmed = false };
        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            // apiFetch only unwraps a { error } shaped body — the raw
            // IdentityError[] Identity returns by default gets silently
            // swallowed into a generic "Request failed" message otherwise.
            var message = string.Join(" ", result.Errors.Select(e => e.Description));
            return BadRequest(new { error = message });
        }

        var code = GenerateOtpCode();
        _context.EmailOtps.Add(new backend.Models.EmailOtp
        {
            UserId = user.Id,
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        });
        await _context.SaveChangesAsync();

        try
        {
            await _emailService.SendOtpEmailAsync(dto.Email, code);
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = "Account created but the verification email failed to send. Try resending.", details = ex.Message });
        }

        return Ok(new RegisterResponseDto { Email = user.Email!, Message = "Verification code sent to your email" });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return NotFound(new { error = "No account found for this email" });
        }

        var otp = await _context.EmailOtps
            .Where(o => o.UserId == user.Id)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (otp == null || otp.Code != dto.Code)
        {
            return BadRequest(new { error = "Invalid verification code" });
        }
        if (otp.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { error = "This code has expired. Request a new one." });
        }

        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);

        // Clean up used/old codes for this user
        var allOtps = await _context.EmailOtps.Where(o => o.UserId == user.Id).ToListAsync();
        _context.EmailOtps.RemoveRange(allOtps);
        await _context.SaveChangesAsync();

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.CreateToken(user, roles);
        return Ok(new AuthResponseDto { Token = token, Email = user.Email! });
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || user.EmailConfirmed)
        {
            // Don't reveal whether the account exists or is already verified
            return Ok(new { message = "If an unverified account exists for this email, a new code was sent." });
        }

        var code = GenerateOtpCode();
        _context.EmailOtps.Add(new backend.Models.EmailOtp
        {
            UserId = user.Id,
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        });
        await _context.SaveChangesAsync();

        await _emailService.SendOtpEmailAsync(dto.Email, code);
        return Ok(new { message = "A new code was sent." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return Unauthorized(new { error = "Invalid email or password" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized(new { error = "Invalid email or password" });
        }

        if (!user.EmailConfirmed)
        {
            return StatusCode(403, new { error = "Please verify your email before logging in", requiresVerification = true, email = user.Email });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.CreateToken(user, roles, dto.RememberMe);
        return Ok(new AuthResponseDto { Token = token, Email = user.Email! });
    }
}
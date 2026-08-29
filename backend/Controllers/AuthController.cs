using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

    public AuthController(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        TokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user = new IdentityUser { UserName = dto.Email, Email = dto.Email };
        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.CreateToken(user, roles);
        return Ok(new AuthResponseDto { Token = token, Email = user.Email! });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return Unauthorized("Invalid email or password");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized("Invalid email or password");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.CreateToken(user, roles);
        return Ok(new AuthResponseDto { Token = token, Email = user.Email! });
    }
}
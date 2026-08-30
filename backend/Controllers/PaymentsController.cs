using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public PaymentsController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private static string Md5Upper(string input)
    {
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToUpperInvariant();
    }

    // Called by our own frontend when the user clicks "Upgrade".
    // Requires login — we need to know WHICH user this order belongs to.
    [HttpPost("initiate")]
    [Authorize]
    public IActionResult Initiate(InitiatePaymentDto dto)
    {
        var merchantId = _configuration["PayHere:MerchantId"]!;
        var merchantSecret = _configuration["PayHere:MerchantSecret"]!;

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;
        var orderId = $"ALMATHS-{userId[..8]}-{DateTime.UtcNow.Ticks}";
        var amount = dto.Amount.ToString("F2"); // PayHere expects 2 decimal places, e.g. "990.00"
        var currency = "LKR";

        // PayHere's required checkout hash formula:
        // MD5( merchant_id + order_id + amount + currency + MD5(merchant_secret) )
        var secretHash = Md5Upper(merchantSecret);
        var hash = Md5Upper($"{merchantId}{orderId}{amount}{currency}{secretHash}");

        return Ok(new PaymentCheckoutDto
        {
            MerchantId = merchantId,
            OrderId = orderId,
            Amount = amount,
            Currency = currency,
            Hash = hash
        });
    }

    // Called by PayHere's servers directly (not our frontend) after a payment
    // attempt. Must NOT require login — PayHere doesn't have our JWT.
    // This is the ONLY place we trust that a payment actually succeeded.
    [HttpPost("notify")]
    [AllowAnonymous]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> Notify([FromForm] PayHereNotifyDto dto)
    {
        var merchantSecret = _configuration["PayHere:MerchantSecret"]!;
        var secretHash = Md5Upper(merchantSecret);

        var expectedSig = Md5Upper(
            $"{dto.merchant_id}{dto.order_id}{dto.payhere_amount}{dto.payhere_currency}{dto.status_code}{secretHash}");

        if (expectedSig != dto.md5sig)
        {
            // Signature mismatch — this request did NOT genuinely come from PayHere.
            // Reject it silently; do not activate any subscription.
            return BadRequest("Invalid signature");
        }

        // status_code "2" means "success" in PayHere's system
        if (dto.status_code == "2")
        {
            var userId = dto.order_id.Split('-')[1]; // matches the order id format we generated above (first 8 chars only — see note below)

            // NOTE: since we only embedded the first 8 characters of the user's
            // GUID into the order id, this is enough to look them up as long as
            // GUIDs don't collide on their first 8 characters (extremely unlikely
            // for a small user base, but worth tightening later by storing the
            // full user id <-> order id mapping in the Subscription row at
            // Initiate() time instead of re-deriving it here).
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.StartsWith(userId));
            if (user == null)
            {
                return NotFound("User not found for this order");
            }

            var subscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.UserId == user.Id);
            if (subscription == null)
            {
                subscription = new Subscription { UserId = user.Id };
                _context.Subscriptions.Add(subscription);
            }

            subscription.Status = "Active";
            subscription.StartedAt = DateTime.UtcNow;
            subscription.ExpiresAt = DateTime.UtcNow.AddMonths(1);
            subscription.PayHereOrderId = dto.order_id;

            await _context.SaveChangesAsync();
        }

        return Ok();
    }

    // Lets the frontend check the current user's plan status
    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> Status()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;
        var subscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId);

        var isActive = subscription is { Status: "Active", ExpiresAt: not null } && subscription.ExpiresAt > DateTime.UtcNow;

        return Ok(new { isPremium = isActive, expiresAt = subscription?.ExpiresAt });
    }
}
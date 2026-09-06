using Microsoft.AspNetCore.Identity;

namespace backend.Models;

// A thin subclass of the bare IdentityUser this app used until now — adds
// just CreatedAt, needed for the admin "User Growth" chart. Every other
// UserManager/SignInManager<IdentityUser> call site keeps working
// unchanged, since ApplicationUser IS an IdentityUser.
public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

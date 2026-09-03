using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class BackfillEmailConfirmedForExistingUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Every account in this table predates email verification —
            // it didn't exist as a concept until this feature shipped, so
            // there's no unverified-on-purpose user to protect here. Without
            // this, every existing account (including admin@example.com,
            // which isn't a real inbox) would be permanently locked out of
            // login the moment this migration is applied.
            migrationBuilder.Sql(@"UPDATE ""AspNetUsers"" SET ""EmailConfirmed"" = true WHERE ""EmailConfirmed"" = false;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally irreversible — there's no way to know which of
            // the now-confirmed users were confirmed by this backfill versus
            // genuinely verified afterward, so Down does nothing rather than
            // guess wrong and lock real, verified users out.
        }
    }
}

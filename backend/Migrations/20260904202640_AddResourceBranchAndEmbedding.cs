using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddResourceBranchAndEmbedding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Branch",
                table: "Resources",
                type: "text",
                nullable: false,
                defaultValue: "Pure");

            migrationBuilder.AddColumn<Vector>(
                name: "Embedding",
                table: "Resources",
                type: "vector",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Branch",
                table: "Resources");

            migrationBuilder.DropColumn(
                name: "Embedding",
                table: "Resources");
        }
    }
}

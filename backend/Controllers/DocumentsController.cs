using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly DocumentProcessingService _processingService;
    private readonly CohereEmbeddingService _embeddingService;
    private readonly SupabaseStorageService _storageService;
    private readonly IAiProvider _aiProvider;

    public DocumentsController(
        AppDbContext context,
        DocumentProcessingService processingService,
        CohereEmbeddingService embeddingService,
        SupabaseStorageService storageService,
        IAiProvider aiProvider)
    {
        _context = context;
        _processingService = processingService;
        _embeddingService = embeddingService;
        _storageService = storageService;
        _aiProvider = aiProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var groups = await _context.DocumentChunks
            .GroupBy(d => d.SourceTitle)
            .Select(g => new DocumentSummaryDto
            {
                SourceTitle = g.Key,
                ChunkCount = g.Count(),
                UploadedAt = g.Min(x => x.CreatedAt)
            })
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

        return Ok(groups);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(150_000_000)] // scanned PDFs can be large (90MB+)
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int? topicId)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }
        if (file.ContentType != "application/pdf")
        {
            return BadRequest("Only PDF files are supported");
        }

        string extractedText;
        using (var stream = file.OpenReadStream())
        {
            extractedText = _processingService.ExtractTextFromPdf(stream);
        }

        List<string> chunks;

        if (_processingService.HasExtractableText(extractedText))
        {
            // Normal path: PDF has a real text layer
            chunks = _processingService.ChunkText(extractedText);
        }
        else
        {
            // Fallback path: scanned PDF, no text layer — OCR each page via vision AI
            using var stream = file.OpenReadStream();
            var pageImages = await _processingService.RasterizePdfPagesAsync(stream);

            chunks = new List<string>();
            foreach (var pageBytes in pageImages)
            {
                using var pageStream = new MemoryStream(pageBytes);
                var pageFileName = $"{Guid.NewGuid()}.jpg";
                var pageImageUrl = await _storageService.UploadDocumentAsync("syllabus-documents", pageFileName, pageStream, "image/jpeg");

                var pageText = await _aiProvider.ExtractTextFromImageAsync(pageImageUrl);
                if (!string.IsNullOrWhiteSpace(pageText) && pageText.Trim().Length > 20)
                {
                    chunks.Add(pageText);
                }
            }
        }

        if (chunks.Count == 0)
        {
            return BadRequest("No usable text could be extracted from this PDF, even with OCR. The scan quality may be too low.");
        }

        // Backup the raw file in Supabase Storage
        try
        {
            using var uploadStream = file.OpenReadStream();
            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            await _storageService.UploadDocumentAsync("syllabus-documents", fileName, uploadStream, "application/pdf");
        }
        catch
        {
            // Non-fatal: the searchable chunks are what matter for the AI;
            // losing the raw backup shouldn't block the upload.
        }

        var chunkEntities = new List<DocumentChunk>();
        for (int i = 0; i < chunks.Count; i++)
        {
            var embedding = await _embeddingService.GetEmbeddingAsync(chunks[i], "search_document");
            chunkEntities.Add(new DocumentChunk
            {
                SourceTitle = file.FileName,
                ChunkText = chunks[i],
                ChunkIndex = i,
                MathTopicId = topicId,
                Embedding = new Pgvector.Vector(embedding)
            });
        }

        _context.DocumentChunks.AddRange(chunkEntities);
        await _context.SaveChangesAsync();

        return Ok(new { sourceTitle = file.FileName, chunksCreated = chunkEntities.Count });
    }

    [HttpDelete("{sourceTitle}")]
    public async Task<IActionResult> Delete(string sourceTitle)
    {
        var chunks = await _context.DocumentChunks.Where(d => d.SourceTitle == sourceTitle).ToListAsync();
        if (chunks.Count == 0) return NotFound();

        _context.DocumentChunks.RemoveRange(chunks);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
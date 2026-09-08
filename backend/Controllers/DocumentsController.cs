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
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int? topicId, [FromForm] int startPage = 0, [FromForm] int? endPage = null)
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
        int pageCount;
        using (var stream = file.OpenReadStream())
        {
            extractedText = _processingService.ExtractTextFromPdf(stream);
        }
        using (var stream = file.OpenReadStream())
        {
            pageCount = _processingService.GetPdfPageCount(stream);
        }

        int chunksCreated = 0;
        string? stoppedReason = null;

        // Every page gets rasterized to an image regardless of which path is
        // taken below — a page's diagrams/graphs live only in this image,
        // never in its text layer (PdfPig's text extraction can't see them
        // at all), so without this a text-based PDF's figures are silently
        // lost even though its text extracts perfectly.
        List<byte[]> pageImages;
        using (var stream = file.OpenReadStream())
        {
            pageImages = await _processingService.RasterizePdfPagesAsync(stream);
        }

        int chunkIndex = 0;

        if (_processingService.HasExtractableText(extractedText, pageCount))
        {
            // Normal path: real text layer. Chunked per-page (not across the
            // whole document) so every chunk can be tied to the one page
            // image that actually carries its diagram, if it has one.
            List<string> pageTexts;
            using (var stream = file.OpenReadStream())
            {
                pageTexts = _processingService.ExtractTextPerPage(stream);
            }

            for (int page = 0; page < pageTexts.Count; page++)
            {
                if (string.IsNullOrWhiteSpace(pageTexts[page])) continue;

                string? pageImageUrl = null;
                if (page < pageImages.Count)
                {
                    try
                    {
                        using var pageStream = new MemoryStream(pageImages[page]);
                        var pageFileName = $"{Guid.NewGuid()}.jpg";
                        pageImageUrl = await _storageService.UploadDocumentAsync("syllabus-documents", pageFileName, pageStream, "image/jpeg");
                    }
                    catch
                    {
                        // Non-fatal — the chunk's text still gets indexed even if its page image fails to upload
                    }
                }

                var chunks = _processingService.ChunkText(pageTexts[page]);
                foreach (var chunkText in chunks)
                {
                    var embedding = await _embeddingService.GetEmbeddingAsync(chunkText, "search_document");
                    _context.DocumentChunks.Add(new DocumentChunk
                    {
                        SourceTitle = file.FileName, ChunkText = chunkText, ChunkIndex = chunkIndex++,
                        MathTopicId = topicId, Embedding = new Pgvector.Vector(embedding), PageImageUrl = pageImageUrl
                    });
                    await _context.SaveChangesAsync(); // save immediately, one chunk at a time
                    chunksCreated++;
                }
            }
        }
        else
        {
            // OCR fallback path: scanned PDF, process page-by-page, saving as we go.
            // startPage/endPage let an admin resume a large document across multiple
            // days if a daily API quota is hit partway through.
            var lastPage = Math.Min(endPage ?? pageImages.Count, pageImages.Count);

            for (int i = startPage; i < lastPage; i++)
            {
                string pageText;
                string? pageImageUrl;
                try
                {
                    using var pageStream = new MemoryStream(pageImages[i]);
                    var pageFileName = $"{Guid.NewGuid()}.jpg";
                    pageImageUrl = await _storageService.UploadDocumentAsync("syllabus-documents", pageFileName, pageStream, "image/jpeg");
                    pageText = await _aiProvider.ExtractTextFromImageAsync(pageImageUrl);
                }
                catch (Exception ex) when (ex.Message.Contains("tokens per day") || ex.Message.Contains("TPD"))
                {
                    // Daily quota exhausted — stop here, but keep everything saved so far.
                    // Report exactly which page to resume from tomorrow.
                    stoppedReason = $"Daily AI quota reached at page {i + 1} of {pageImages.Count}. " +
                                     $"Resume tomorrow using startPage={i} for this same file.";
                    break;
                }

                if (!string.IsNullOrWhiteSpace(pageText) && pageText.Trim().Length > 20)
                {
                    var embedding = await _embeddingService.GetEmbeddingAsync(pageText, "search_document");
                    _context.DocumentChunks.Add(new DocumentChunk
                    {
                        SourceTitle = file.FileName, ChunkText = pageText, ChunkIndex = i,
                        MathTopicId = topicId, Embedding = new Pgvector.Vector(embedding), PageImageUrl = pageImageUrl
                    });
                    await _context.SaveChangesAsync(); // save this page immediately
                    chunksCreated++;
                }
            }
        }

        if (chunksCreated == 0 && stoppedReason == null)
        {
            return BadRequest("No usable text could be extracted from this PDF, even with OCR.");
        }

        // Backup the raw file (best-effort, only on the first call for this file)
        if (startPage == 0)
        {
            try
            {
                using var uploadStream = file.OpenReadStream();
                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                await _storageService.UploadDocumentAsync("syllabus-documents", fileName, uploadStream, "application/pdf");
            }
            catch
            {
                // Non-fatal — the searchable chunks matter more than the raw backup
            }
        }

        return Ok(new { sourceTitle = file.FileName, chunksCreated, stoppedReason });
    }

    [HttpDelete("{sourceTitle}")]
    public async Task<IActionResult> Delete(string sourceTitle)
    {
        var chunks = await _context.DocumentChunks.Where(d => d.SourceTitle == sourceTitle).ToListAsync();
        if (chunks.Count == 0) return NotFound();

        // Each page image is shared across every chunk from that page, so
        // dedupe before deleting — otherwise the 2nd+ delete of the same
        // URL just hits a 404 from Supabase (harmless, but wasted calls).
        var imageUrls = chunks
            .Select(c => c.PageImageUrl)
            .Where(url => !string.IsNullOrEmpty(url))
            .Distinct()
            .ToList();

        foreach (var url in imageUrls)
        {
            await _storageService.DeleteFileByUrlAsync(url!);
        }

        _context.DocumentChunks.RemoveRange(chunks);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
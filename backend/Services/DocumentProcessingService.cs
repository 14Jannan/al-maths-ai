using UglyToad.PdfPig;

namespace backend.Services;

public class DocumentProcessingService
{
    // Extracts all text from a PDF, page by page.
    public string ExtractTextFromPdf(Stream pdfStream)
    {
        using var document = PdfDocument.Open(pdfStream);
        var text = new System.Text.StringBuilder();
        foreach (var page in document.GetPages())
        {
            text.AppendLine(page.Text);
        }
        return text.ToString();
    }

    // Splits text into overlapping word-count chunks. Overlap means each
    // chunk shares a few sentences with its neighbour, so an idea that
    // spans a chunk boundary doesn't get cut in half and lost from search.
    public List<string> ChunkText(string text, int wordsPerChunk = 200, int overlapWords = 40)
    {
        var words = text.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);
        var chunks = new List<string>();

        int start = 0;
        while (start < words.Length)
        {
            var length = Math.Min(wordsPerChunk, words.Length - start);
            var chunkWords = words.Skip(start).Take(length);
            var chunkText = string.Join(' ', chunkWords).Trim();

            if (chunkText.Length > 20) // skip near-empty trailing chunks
            {
                chunks.Add(chunkText);
            }

            if (start + wordsPerChunk >= words.Length) break;
            start += wordsPerChunk - overlapWords;
        }

        return chunks;
    }

    // Total page count — used alongside the extracted text to compute
    // average text density per page (see HasExtractableText below).
    public int GetPdfPageCount(Stream pdfStream)
    {
        using var document = PdfDocument.Open(pdfStream);
        return document.NumberOfPages;
    }

    // A real text layer produces substantial text on EVERY page. A PDF
    // whose only "text" is a thin watermark stamped over scanned images
    // (common with tools like A-PDF Watermark) will pass a simple
    // "any text at all?" check but fail this average-density check.
    public bool HasExtractableText(string text, int pageCount)
    {
        if (string.IsNullOrWhiteSpace(text) || pageCount == 0) return false;
        var averageCharsPerPage = text.Trim().Length / (double)pageCount;
        return averageCharsPerPage > 150;
    }

    // Converts each page of a scanned PDF into a JPEG image, so it can be
    // sent to the vision model for OCR instead of text extraction.
    public async Task<List<byte[]>> RasterizePdfPagesAsync(Stream pdfStream)
    {
        using var ms = new MemoryStream();
        await pdfStream.CopyToAsync(ms);
        var pdfBytes = ms.ToArray();

        var images = new List<byte[]>();
        var pageCount = PDFtoImage.Conversion.GetPageCount(pdfBytes);

        for (int i = 0; i < pageCount; i++)
        {
            using var bitmap = PDFtoImage.Conversion.ToImage(pdfBytes, page: i);
            using var imgStream = new MemoryStream();
            bitmap.Encode(imgStream, SkiaSharp.SKEncodedImageFormat.Jpeg, 85);
            images.Add(imgStream.ToArray());
        }

        return images;
    }
}
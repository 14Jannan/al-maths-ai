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
}
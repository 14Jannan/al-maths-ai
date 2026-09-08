namespace backend.Services;

public class SupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public SupabaseStorageService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    // Uploads a file's bytes to the "question-images" bucket and returns its
    // public URL. We generate the file path ourselves (userId + guid) so
    // filenames can never collide or leak anything about the original name.
    public async Task<string> UploadQuestionImageAsync(string userId, Stream fileStream, string contentType, string extension)
    {
        var fileName = $"{userId}/{Guid.NewGuid()}{extension}";
        return await UploadDocumentAsync("question-images", fileName, fileStream, contentType);
    }

    // Uploads a file's bytes to an arbitrary bucket/path and returns its
    // public URL — used for admin document uploads, where the caller
    // decides the bucket and file name.
    public async Task<string> UploadDocumentAsync(string bucket, string fileName, Stream fileStream, string contentType)
    {
        var supabaseUrl = _configuration["Supabase:Url"]!;
        var serviceRoleKey = _configuration["Supabase:ServiceRoleKey"]!;

        var uploadUrl = $"{supabaseUrl}/storage/v1/object/{bucket}/{fileName}";

        var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("Authorization", $"Bearer {serviceRoleKey}");
        // Supabase's gateway expects this on every REST/Storage request,
        // separately from Authorization (which carries the role for RLS).
        request.Headers.Add("apikey", serviceRoleKey);
        request.Content = new StreamContent(fileStream);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Document upload failed: {error}");
        }

        return $"{supabaseUrl}/storage/v1/object/public/{bucket}/{fileName}";
    }

    // Deletes a file given the public URL UploadDocumentAsync/UploadQuestionImageAsync
    // returned — parses the bucket/path back out of it rather than requiring
    // the caller to have kept those separately. Best-effort: a delete that
    // fails (file already gone, transient network issue) shouldn't block
    // whatever database cleanup the caller is doing alongside it.
    public async Task DeleteFileByUrlAsync(string publicUrl)
    {
        const string marker = "/storage/v1/object/public/";
        var markerIndex = publicUrl.IndexOf(marker, StringComparison.Ordinal);
        if (markerIndex < 0) return; // not a recognizable Supabase Storage URL

        var bucketAndPath = publicUrl[(markerIndex + marker.Length)..];
        var supabaseUrl = _configuration["Supabase:Url"]!;
        var serviceRoleKey = _configuration["Supabase:ServiceRoleKey"]!;

        var request = new HttpRequestMessage(HttpMethod.Delete, $"{supabaseUrl}/storage/v1/object/{bucketAndPath}");
        request.Headers.Add("Authorization", $"Bearer {serviceRoleKey}");
        request.Headers.Add("apikey", serviceRoleKey);

        try
        {
            await _httpClient.SendAsync(request);
        }
        catch
        {
            // Non-fatal — an orphaned storage file is a much smaller problem
            // than a delete that appears to fail from the admin's perspective.
        }
    }
}
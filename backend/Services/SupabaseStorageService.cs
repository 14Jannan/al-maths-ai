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
    public async Task<string> UploadQuestionImageAsync(string userId, Stream fileStream, string contentType, string fileExtension)
    {
        var supabaseUrl = _configuration["Supabase:Url"]!;
        var serviceRoleKey = _configuration["Supabase:ServiceRoleKey"]!;

        var fileName = $"{userId}/{Guid.NewGuid()}{fileExtension}";
        var uploadUrl = $"{supabaseUrl}/storage/v1/object/question-images/{fileName}";

        var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("Authorization", $"Bearer {serviceRoleKey}");
        request.Content = new StreamContent(fileStream);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Image upload failed: {error}");
        }

        return $"{supabaseUrl}/storage/v1/object/public/question-images/{fileName}";
    }
}
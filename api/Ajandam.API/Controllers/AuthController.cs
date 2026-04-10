using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Auth;
using Ajandam.Application.Services.Interfaces;
using Ajandam.API.Services;

namespace Ajandam.API.Controllers;

[Route("api/auth")]
public class AuthController : BaseController
{
    private readonly IAuthService _authService;
    private readonly SyncTokenStore _tokenStore;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        SyncTokenStore tokenStore,
        IConfiguration config,
        IHttpClientFactory httpFactory,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _tokenStore = tokenStore;
        _config = config;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        try
        {
            // Register locally
            var result = await _authService.RegisterAsync(dto);

            // Also register on remote (if configured)
            await TryRemoteRegister(dto);

            // Authenticate with remote for sync token
            await TryRemoteLogin(dto.Email, dto.Password, result.UserId);

            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        try
        {
            var result = await _authService.LoginAsync(dto);

            // Authenticate with remote for sync token
            await TryRemoteLogin(dto.Email, dto.Password, result.UserId);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        return Ok(await _authService.GetProfileAsync(GetUserId()));
    }

    [HttpPut("theme")]
    [Authorize]
    public async Task<IActionResult> UpdateTheme([FromBody] string themeColor)
    {
        return Ok(await _authService.UpdateThemeAsync(GetUserId(), themeColor));
    }

    /// <summary>
    /// Try to authenticate with remote API and store the token for sync.
    /// </summary>
    private async Task TryRemoteLogin(string email, string password, Guid localUserId)
    {
        var remoteUrl = _config["Sync:RemoteUrl"];
        if (string.IsNullOrWhiteSpace(remoteUrl)) return;

        try
        {
            var http = _httpFactory.CreateClient("SyncClient");
            http.BaseAddress = new Uri(remoteUrl.TrimEnd('/'));

            var body = new StringContent(
                JsonSerializer.Serialize(new { email, password }),
                Encoding.UTF8, "application/json");

            var response = await http.PostAsync("/api/auth/login", body);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                var token = doc.RootElement.GetProperty("token").GetString();

                _tokenStore.RemoteToken = token;
                _tokenStore.UserId = localUserId;
                _tokenStore.IsOnline = true;

                _logger.LogInformation("Remote auth successful. Sync enabled.");
            }
            else
            {
                _logger.LogWarning("Remote login failed: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Remote API unreachable: {Message}", ex.Message);
            _tokenStore.IsOnline = false;
        }
    }

    /// <summary>
    /// Try to register the user on remote API too.
    /// </summary>
    private async Task TryRemoteRegister(RegisterDto dto)
    {
        var remoteUrl = _config["Sync:RemoteUrl"];
        if (string.IsNullOrWhiteSpace(remoteUrl)) return;

        try
        {
            var http = _httpFactory.CreateClient("SyncClient");
            http.BaseAddress = new Uri(remoteUrl.TrimEnd('/'));

            var body = new StringContent(
                JsonSerializer.Serialize(new { dto.FullName, dto.Email, dto.Password }),
                Encoding.UTF8, "application/json");

            var response = await http.PostAsync("/api/auth/register", body);
            if (response.IsSuccessStatusCode)
                _logger.LogInformation("Remote registration successful.");
            else
                _logger.LogWarning("Remote registration failed (may already exist): {Status}", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Remote API unreachable for registration: {Message}", ex.Message);
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.API.Services;

namespace Ajandam.API.Controllers;

[Route("api/sync-status")]
[Authorize]
public class SyncStatusController : BaseController
{
    private readonly SyncTokenStore _tokenStore;
    private readonly IConfiguration _config;

    public SyncStatusController(SyncTokenStore tokenStore, IConfiguration config)
    {
        _tokenStore = tokenStore;
        _config = config;
    }

    [HttpGet]
    public IActionResult GetStatus()
    {
        var remoteUrl = _config["Sync:RemoteUrl"];
        return Ok(new
        {
            syncEnabled = !string.IsNullOrWhiteSpace(remoteUrl),
            isOnline = _tokenStore.IsOnline,
            lastSyncedAt = _tokenStore.LastSyncedAt,
        });
    }
}

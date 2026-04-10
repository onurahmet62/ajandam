namespace Ajandam.API.Services;

/// <summary>
/// Singleton that holds the remote API JWT token and user credentials for sync.
/// </summary>
public class SyncTokenStore
{
    public string? RemoteToken { get; set; }
    public Guid? UserId { get; set; }
    public DateTime? LastSyncedAt { get; set; }
    public bool IsOnline { get; set; }

    private readonly string _stateFilePath;

    public SyncTokenStore()
    {
        var appData = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Ajandam");
        Directory.CreateDirectory(appData);
        _stateFilePath = Path.Combine(appData, "sync-state.txt");
        LoadState();
    }

    public void SaveState()
    {
        try
        {
            File.WriteAllText(_stateFilePath, LastSyncedAt?.ToString("o") ?? "");
        }
        catch { /* ignore file errors */ }
    }

    private void LoadState()
    {
        try
        {
            if (File.Exists(_stateFilePath))
            {
                var text = File.ReadAllText(_stateFilePath).Trim();
                if (DateTime.TryParse(text, out var dt))
                    LastSyncedAt = dt;
            }
        }
        catch { /* ignore */ }
    }
}

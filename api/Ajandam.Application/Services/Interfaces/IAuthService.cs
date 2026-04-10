using Ajandam.Application.DTOs.Auth;
namespace Ajandam.Application.Services.Interfaces;
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserProfileDto> GetProfileAsync(Guid userId);
    Task<UserProfileDto> UpdateThemeAsync(Guid userId, string themeColor);
}

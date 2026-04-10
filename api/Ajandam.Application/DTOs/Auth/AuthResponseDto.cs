namespace Ajandam.Application.DTOs.Auth;
public record AuthResponseDto(Guid UserId, string FullName, string Email, string Token, string ThemeColor);

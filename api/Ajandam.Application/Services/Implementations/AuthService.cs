using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Ajandam.Application.DTOs.Auth;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Ajandam.Application.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly IGroupInvitationService? _invitationService;

    public AuthService(IUnitOfWork uow, IConfiguration config, IGroupInvitationService? invitationService = null)
    {
        _uow = uow;
        _config = config;
        _invitationService = invitationService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existing = (await _uow.Users.FindAsync(u => u.Email == dto.Email)).FirstOrDefault();
        if (existing != null)
            throw new InvalidOperationException("Bu e-posta adresi zaten kayitli.");

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };
        await _uow.Users.AddAsync(user);
        await _uow.SaveChangesAsync();

        // Process pending group invitations for this email
        if (_invitationService != null)
            await _invitationService.ProcessPendingOnRegisterAsync(user.Email, user.Id);

        var token = GenerateToken(user);
        return new AuthResponseDto(user.Id, user.FullName, user.Email, token, user.ThemeColor);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = (await _uow.Users.FindAsync(u => u.Email == dto.Email)).FirstOrDefault();
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Gecersiz e-posta veya sifre.");

        var token = GenerateToken(user);
        return new AuthResponseDto(user.Id, user.FullName, user.Email, token, user.ThemeColor);
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) throw new KeyNotFoundException("Kullanici bulunamadi.");
        return new UserProfileDto(user.Id, user.FullName, user.Email, user.ThemeColor);
    }

    public async Task<UserProfileDto> UpdateThemeAsync(Guid userId, string themeColor)
    {
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) throw new KeyNotFoundException("Kullanici bulunamadi.");
        user.ThemeColor = themeColor;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();
        return new UserProfileDto(user.Id, user.FullName, user.Email, user.ThemeColor);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName)
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

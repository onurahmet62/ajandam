using Ajandam.Application.DTOs.Countdowns;
namespace Ajandam.Application.Services.Interfaces;
public interface ICountdownService
{
    Task<CountdownDto> CreateAsync(Guid userId, CreateCountdownDto dto);
    Task<IEnumerable<CountdownDto>> GetAllAsync(Guid userId);
    Task<IEnumerable<CountdownDto>> GetActiveAsync(Guid userId);
    Task<bool> ToggleAsync(Guid userId, Guid countdownId);
    Task<bool> DeleteAsync(Guid userId, Guid countdownId);
}

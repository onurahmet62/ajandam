using Ajandam.Application.DTOs.SpecialDays;

namespace Ajandam.Application.Services.Interfaces;

public interface ISpecialDayService
{
    Task<SpecialDayDto> CreateAsync(Guid userId, CreateSpecialDayDto dto);
    Task<IEnumerable<SpecialDayDto>> GetAllAsync(Guid userId);
    Task<IEnumerable<SpecialDayDto>> GetByRangeAsync(Guid userId, DateTime start, DateTime end);
    Task<SpecialDayDto?> UpdateAsync(Guid userId, Guid id, UpdateSpecialDayDto dto);
    Task<bool> DeleteAsync(Guid userId, Guid id);
}

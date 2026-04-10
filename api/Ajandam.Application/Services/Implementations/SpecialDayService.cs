using Microsoft.EntityFrameworkCore;
using Ajandam.Application.DTOs.SpecialDays;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class SpecialDayService : ISpecialDayService
{
    private readonly IUnitOfWork _uow;

    public SpecialDayService(IUnitOfWork uow) { _uow = uow; }

    public async Task<SpecialDayDto> CreateAsync(Guid userId, CreateSpecialDayDto dto)
    {
        var entity = new SpecialDay
        {
            Title = dto.Title,
            Date = dto.Date.Date,
            IsYearly = dto.IsYearly,
            Color = dto.Color,
            UserId = userId
        };
        await _uow.SpecialDays.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<IEnumerable<SpecialDayDto>> GetAllAsync(Guid userId)
    {
        var items = await _uow.SpecialDays.Query
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.Date)
            .ToListAsync();
        return items.Select(Map);
    }

    public async Task<IEnumerable<SpecialDayDto>> GetByRangeAsync(Guid userId, DateTime start, DateTime end)
    {
        var items = await _uow.SpecialDays.Query
            .Where(s => s.UserId == userId)
            .ToListAsync();

        // Filter: non-yearly must be in range, yearly matches month/day in range
        var results = items.Where(s =>
        {
            if (!s.IsYearly)
                return s.Date >= start && s.Date <= end;

            // Yearly: check if the anniversary falls in the range
            for (var year = start.Year; year <= end.Year; year++)
            {
                try
                {
                    var anniversary = new DateTime(year, s.Date.Month, s.Date.Day);
                    if (anniversary >= start && anniversary <= end)
                        return true;
                }
                catch { /* Feb 29 in non-leap year */ }
            }
            return false;
        });

        return results.Select(Map);
    }

    public async Task<SpecialDayDto?> UpdateAsync(Guid userId, Guid id, UpdateSpecialDayDto dto)
    {
        var entity = await _uow.SpecialDays.Query
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (entity == null) return null;

        if (dto.Title != null) entity.Title = dto.Title;
        if (dto.Date.HasValue) entity.Date = dto.Date.Value.Date;
        if (dto.IsYearly.HasValue) entity.IsYearly = dto.IsYearly.Value;
        if (dto.Color != null) entity.Color = dto.Color;

        _uow.SpecialDays.Update(entity);
        await _uow.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var entity = await _uow.SpecialDays.Query
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (entity == null) return false;
        _uow.SpecialDays.Delete(entity);
        await _uow.SaveChangesAsync();
        return true;
    }

    private static SpecialDayDto Map(SpecialDay s) => new(s.Id, s.Title, s.Date, s.IsYearly, s.Color);
}

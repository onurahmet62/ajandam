using AutoMapper;
using Ajandam.Application.DTOs.Countdowns;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class CountdownService : ICountdownService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CountdownService(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }

    public async Task<CountdownDto> CreateAsync(Guid userId, CreateCountdownDto dto)
    {
        var countdown = new Countdown { Title = dto.Title, TargetDate = dto.TargetDate, UserId = userId };
        await _uow.Countdowns.AddAsync(countdown);
        await _uow.SaveChangesAsync();
        return _mapper.Map<CountdownDto>(countdown);
    }

    public async Task<IEnumerable<CountdownDto>> GetAllAsync(Guid userId)
    {
        var countdowns = await _uow.Countdowns.FindAsync(c => c.UserId == userId);
        return _mapper.Map<IEnumerable<CountdownDto>>(countdowns.OrderBy(c => c.TargetDate));
    }

    public async Task<IEnumerable<CountdownDto>> GetActiveAsync(Guid userId)
    {
        var countdowns = await _uow.Countdowns.FindAsync(c => c.UserId == userId && c.IsActive && c.TargetDate > DateTime.UtcNow);
        return _mapper.Map<IEnumerable<CountdownDto>>(countdowns.OrderBy(c => c.TargetDate));
    }

    public async Task<bool> ToggleAsync(Guid userId, Guid countdownId)
    {
        var countdown = (await _uow.Countdowns.FindAsync(c => c.Id == countdownId && c.UserId == userId)).FirstOrDefault();
        if (countdown == null) return false;
        countdown.IsActive = !countdown.IsActive;
        _uow.Countdowns.Update(countdown);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid countdownId)
    {
        var countdown = (await _uow.Countdowns.FindAsync(c => c.Id == countdownId && c.UserId == userId)).FirstOrDefault();
        if (countdown == null) return false;
        _uow.Countdowns.Delete(countdown);
        await _uow.SaveChangesAsync();
        return true;
    }
}

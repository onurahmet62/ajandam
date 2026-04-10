using AutoMapper;
using Ajandam.Application.DTOs.Journal;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class JournalService : IJournalService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public JournalService(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }

    public async Task<JournalEntryDto> CreateAsync(Guid userId, CreateJournalEntryDto dto)
    {
        var entry = new JournalEntry { Content = dto.Content, Date = dto.Date, Mood = dto.Mood, UserId = userId };
        await _uow.JournalEntries.AddAsync(entry);
        await _uow.SaveChangesAsync();
        return _mapper.Map<JournalEntryDto>(entry);
    }

    public async Task<IEnumerable<JournalEntryDto>> GetAllAsync(Guid userId)
    {
        var entries = await _uow.JournalEntries.FindAsync(j => j.UserId == userId);
        return _mapper.Map<IEnumerable<JournalEntryDto>>(entries.OrderByDescending(j => j.Date));
    }

    public async Task<IEnumerable<JournalEntryDto>> GetByMonthAsync(Guid userId, int year, int month)
    {
        var entries = await _uow.JournalEntries.FindAsync(j => j.UserId == userId && j.Date.Year == year && j.Date.Month == month);
        return _mapper.Map<IEnumerable<JournalEntryDto>>(entries.OrderBy(j => j.Date));
    }

    public async Task<JournalEntryDto?> GetByDateAsync(Guid userId, DateTime date)
    {
        var entry = (await _uow.JournalEntries.FindAsync(j => j.UserId == userId && j.Date.Date == date.Date)).FirstOrDefault();
        return entry == null ? null : _mapper.Map<JournalEntryDto>(entry);
    }

    public async Task<JournalEntryDto?> UpdateAsync(Guid userId, Guid entryId, UpdateJournalEntryDto dto)
    {
        var entry = (await _uow.JournalEntries.FindAsync(j => j.Id == entryId && j.UserId == userId)).FirstOrDefault();
        if (entry == null) return null;
        if (dto.Content != null) entry.Content = dto.Content;
        if (dto.Mood != null) entry.Mood = dto.Mood;
        _uow.JournalEntries.Update(entry);
        await _uow.SaveChangesAsync();
        return _mapper.Map<JournalEntryDto>(entry);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid entryId)
    {
        var entry = (await _uow.JournalEntries.FindAsync(j => j.Id == entryId && j.UserId == userId)).FirstOrDefault();
        if (entry == null) return false;
        _uow.JournalEntries.Delete(entry);
        await _uow.SaveChangesAsync();
        return true;
    }
}

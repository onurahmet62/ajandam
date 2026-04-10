using Ajandam.Application.DTOs.Journal;
namespace Ajandam.Application.Services.Interfaces;
public interface IJournalService
{
    Task<JournalEntryDto> CreateAsync(Guid userId, CreateJournalEntryDto dto);
    Task<IEnumerable<JournalEntryDto>> GetAllAsync(Guid userId);
    Task<IEnumerable<JournalEntryDto>> GetByMonthAsync(Guid userId, int year, int month);
    Task<JournalEntryDto?> GetByDateAsync(Guid userId, DateTime date);
    Task<JournalEntryDto?> UpdateAsync(Guid userId, Guid entryId, UpdateJournalEntryDto dto);
    Task<bool> DeleteAsync(Guid userId, Guid entryId);
}

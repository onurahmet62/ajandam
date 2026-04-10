using Ajandam.Application.DTOs.Notes;
namespace Ajandam.Application.Services.Interfaces;
public interface INoteService
{
    Task<NoteDto> CreateAsync(Guid userId, CreateNoteDto dto);
    Task<IEnumerable<NoteDto>> GetAllAsync(Guid userId);
    Task<IEnumerable<NoteDto>> GetByDateAsync(Guid userId, DateTime date);
    Task<NoteDto?> UpdateAsync(Guid userId, Guid noteId, UpdateNoteDto dto);
    Task<bool> DeleteAsync(Guid userId, Guid noteId);
}

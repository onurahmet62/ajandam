using AutoMapper;
using Ajandam.Application.DTOs.Notes;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class NoteService : INoteService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public NoteService(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }

    public async Task<NoteDto> CreateAsync(Guid userId, CreateNoteDto dto)
    {
        var note = new Note { Title = dto.Title, Content = dto.Content, Date = dto.Date, UserId = userId };
        await _uow.Notes.AddAsync(note);
        await _uow.SaveChangesAsync();
        return _mapper.Map<NoteDto>(note);
    }

    public async Task<IEnumerable<NoteDto>> GetAllAsync(Guid userId)
    {
        var notes = await _uow.Notes.FindAsync(n => n.UserId == userId);
        return _mapper.Map<IEnumerable<NoteDto>>(notes.OrderByDescending(n => n.Date));
    }

    public async Task<IEnumerable<NoteDto>> GetByDateAsync(Guid userId, DateTime date)
    {
        var notes = await _uow.Notes.FindAsync(n => n.UserId == userId && n.Date.Date == date.Date);
        return _mapper.Map<IEnumerable<NoteDto>>(notes);
    }

    public async Task<NoteDto?> UpdateAsync(Guid userId, Guid noteId, UpdateNoteDto dto)
    {
        var note = (await _uow.Notes.FindAsync(n => n.Id == noteId && n.UserId == userId)).FirstOrDefault();
        if (note == null) return null;
        if (dto.Title != null) note.Title = dto.Title;
        if (dto.Content != null) note.Content = dto.Content;
        _uow.Notes.Update(note);
        await _uow.SaveChangesAsync();
        return _mapper.Map<NoteDto>(note);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid noteId)
    {
        var note = (await _uow.Notes.FindAsync(n => n.Id == noteId && n.UserId == userId)).FirstOrDefault();
        if (note == null) return false;
        _uow.Notes.Delete(note);
        await _uow.SaveChangesAsync();
        return true;
    }
}

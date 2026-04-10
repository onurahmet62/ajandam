using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Notes;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[Route("api/notes")]
[Authorize]
public class NotesController : BaseController
{
    private readonly INoteService _noteService;
    public NotesController(INoteService noteService) => _noteService = noteService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateNoteDto dto) => Ok(await _noteService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _noteService.GetAllAsync(GetUserId()));

    [HttpGet("date/{date}")]
    public async Task<IActionResult> GetByDate(DateTime date) => Ok(await _noteService.GetByDateAsync(GetUserId(), date));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateNoteDto dto)
    {
        var note = await _noteService.UpdateAsync(GetUserId(), id, dto);
        return note == null ? NotFound() : Ok(note);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) => await _noteService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();
}

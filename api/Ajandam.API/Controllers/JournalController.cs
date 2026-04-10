using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Journal;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[Route("api/journal")]
[Authorize]
public class JournalController : BaseController
{
    private readonly IJournalService _journalService;
    public JournalController(IJournalService journalService) => _journalService = journalService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateJournalEntryDto dto) => Ok(await _journalService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _journalService.GetAllAsync(GetUserId()));

    [HttpGet("month/{year}/{month}")]
    public async Task<IActionResult> GetByMonth(int year, int month) => Ok(await _journalService.GetByMonthAsync(GetUserId(), year, month));

    [HttpGet("date/{date}")]
    public async Task<IActionResult> GetByDate(DateTime date)
    {
        var entry = await _journalService.GetByDateAsync(GetUserId(), date);
        return entry == null ? NotFound() : Ok(entry);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateJournalEntryDto dto)
    {
        var entry = await _journalService.UpdateAsync(GetUserId(), id, dto);
        return entry == null ? NotFound() : Ok(entry);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) => await _journalService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();
}

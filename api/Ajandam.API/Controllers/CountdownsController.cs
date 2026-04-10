using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Countdowns;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[Route("api/countdowns")]
[Authorize]
public class CountdownsController : BaseController
{
    private readonly ICountdownService _countdownService;
    public CountdownsController(ICountdownService countdownService) => _countdownService = countdownService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateCountdownDto dto) => Ok(await _countdownService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _countdownService.GetAllAsync(GetUserId()));

    [HttpGet("active")]
    public async Task<IActionResult> GetActive() => Ok(await _countdownService.GetActiveAsync(GetUserId()));

    [HttpPut("{id}/toggle")]
    public async Task<IActionResult> Toggle(Guid id) => await _countdownService.ToggleAsync(GetUserId(), id) ? Ok() : NotFound();

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) => await _countdownService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();
}

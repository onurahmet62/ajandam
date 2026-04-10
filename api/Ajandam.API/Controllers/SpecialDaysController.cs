using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.SpecialDays;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[ApiController]
[Route("api/special-days")]
[Authorize]
public class SpecialDaysController : ControllerBase
{
    private readonly ISpecialDayService _service;

    public SpecialDaysController(ISpecialDayService service) { _service = service; }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync(UserId));

    [HttpGet("range")]
    public async Task<IActionResult> GetByRange([FromQuery] DateTime start, [FromQuery] DateTime end) =>
        Ok(await _service.GetByRangeAsync(UserId, start, end));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSpecialDayDto dto) =>
        Ok(await _service.CreateAsync(UserId, dto));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSpecialDayDto dto)
    {
        var result = await _service.UpdateAsync(UserId, id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) =>
        await _service.DeleteAsync(UserId, id) ? NoContent() : NotFound();
}

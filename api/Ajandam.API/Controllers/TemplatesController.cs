using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Templates;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[Route("api/templates")]
[Authorize]
public class TemplatesController : BaseController
{
    private readonly ITaskTemplateService _templateService;
    public TemplatesController(ITaskTemplateService templateService) => _templateService = templateService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateTaskTemplateDto dto) => Ok(await _templateService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _templateService.GetAllAsync(GetUserId()));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) => await _templateService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();
}

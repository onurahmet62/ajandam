using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Tags;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[Route("api/tags")]
[Authorize]
public class TagsController : BaseController
{
    private readonly ITagService _tagService;
    public TagsController(ITagService tagService) => _tagService = tagService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateTagDto dto) => Ok(await _tagService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _tagService.GetAllAsync(GetUserId()));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateTagDto dto)
    {
        var tag = await _tagService.UpdateAsync(GetUserId(), id, dto);
        return tag == null ? NotFound() : Ok(tag);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) => await _tagService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();
}

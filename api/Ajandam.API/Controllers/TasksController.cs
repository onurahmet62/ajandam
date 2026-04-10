using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ajandam.Application.DTOs.Tasks;
using Ajandam.Application.Services.Interfaces;

namespace Ajandam.API.Controllers;

[Route("api/tasks")]
[Authorize]
public class TasksController : BaseController
{
    private readonly ITodoTaskService _taskService;
    public TasksController(ITodoTaskService taskService) => _taskService = taskService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateTodoTaskDto dto)
        => Ok(await _taskService.CreateAsync(GetUserId(), dto));

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _taskService.GetAllAsync(GetUserId()));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var task = await _taskService.GetByIdAsync(GetUserId(), id);
        return task == null ? NotFound() : Ok(task);
    }

    [HttpGet("range")]
    public async Task<IActionResult> GetByDateRange([FromQuery] DateTime start, [FromQuery] DateTime end)
        => Ok(await _taskService.GetByDateRangeAsync(GetUserId(), start, end));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateTodoTaskDto dto)
    {
        var task = await _taskService.UpdateAsync(GetUserId(), id, dto);
        return task == null ? NotFound() : Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _taskService.DeleteAsync(GetUserId(), id) ? NoContent() : NotFound();

    [HttpPut("{id}/reschedule")]
    public async Task<IActionResult> Reschedule(Guid id, RescheduleTaskDto dto)
    {
        var task = await _taskService.RescheduleAsync(GetUserId(), id, dto);
        return task == null ? NotFound() : Ok(task);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
        => Ok(await _taskService.SearchAsync(GetUserId(), q));
}

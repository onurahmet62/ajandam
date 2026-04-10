using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Ajandam.Application.DTOs.Tasks;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Enums;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class TodoTaskService : ITodoTaskService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public TodoTaskService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<TodoTaskDto> CreateAsync(Guid userId, CreateTodoTaskDto dto)
    {
        var task = new TodoTask
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Status = TodoStatus.Planlandi,
            DueDate = dto.DueDate,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            RecurrenceType = dto.RecurrenceType,
            RecurrenceInterval = dto.RecurrenceInterval,
            RecurrenceEndDate = dto.RecurrenceEndDate,
            UserId = userId
        };
        await _uow.TodoTasks.AddAsync(task);
        await _uow.SaveChangesAsync();

        if (dto.TagIds?.Any() == true)
        {
            foreach (var tagId in dto.TagIds)
            {
                var tag = await _uow.Tags.GetByIdAsync(tagId);
                if (tag != null && tag.UserId == userId)
                    task.TodoTaskTags.Add(new TodoTaskTag { TodoTaskId = task.Id, TagId = tagId });
            }
            await _uow.SaveChangesAsync();
        }

        return await GetByIdAsync(userId, task.Id) ?? throw new Exception("Task creation failed");
    }

    public async Task<TodoTaskDto?> GetByIdAsync(Guid userId, Guid taskId)
    {
        var task = await _uow.TodoTasks.Query
            .Include(t => t.TodoTaskTags).ThenInclude(tt => tt.Tag)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
        return task == null ? null : _mapper.Map<TodoTaskDto>(task);
    }

    public async Task<IEnumerable<TodoTaskDto>> GetAllAsync(Guid userId)
    {
        var tasks = await _uow.TodoTasks.Query
            .Include(t => t.TodoTaskTags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return _mapper.Map<IEnumerable<TodoTaskDto>>(tasks);
    }

    public async Task<IEnumerable<TodoTaskDto>> GetByDateRangeAsync(Guid userId, DateTime start, DateTime end)
    {
        var tasks = await _uow.TodoTasks.Query
            .Include(t => t.TodoTaskTags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == userId &&
                ((t.StartDate >= start && t.StartDate <= end) ||
                 (t.DueDate >= start && t.DueDate <= end) ||
                 (t.StartDate <= start && (t.EndDate ?? t.DueDate) >= start)))
            .OrderBy(t => t.StartDate ?? t.DueDate)
            .ToListAsync();
        return _mapper.Map<IEnumerable<TodoTaskDto>>(tasks);
    }

    public async Task<TodoTaskDto?> UpdateAsync(Guid userId, Guid taskId, UpdateTodoTaskDto dto)
    {
        var task = await _uow.TodoTasks.Query
            .Include(t => t.TodoTaskTags)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
        if (task == null) return null;

        if (dto.Title != null) task.Title = dto.Title;
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;
        if (dto.Status.HasValue) task.Status = dto.Status.Value;
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate;
        if (dto.StartDate.HasValue) task.StartDate = dto.StartDate;
        if (dto.EndDate.HasValue) task.EndDate = dto.EndDate;

        if (dto.TagIds != null)
        {
            task.TodoTaskTags.Clear();
            foreach (var tagId in dto.TagIds)
            {
                task.TodoTaskTags.Add(new TodoTaskTag { TodoTaskId = task.Id, TagId = tagId });
            }
        }

        _uow.TodoTasks.Update(task);
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(userId, taskId);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid taskId)
    {
        var task = (await _uow.TodoTasks.FindAsync(t => t.Id == taskId && t.UserId == userId)).FirstOrDefault();
        if (task == null) return false;
        _uow.TodoTasks.Delete(task);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<TodoTaskDto?> RescheduleAsync(Guid userId, Guid taskId, RescheduleTaskDto dto)
    {
        var task = (await _uow.TodoTasks.FindAsync(t => t.Id == taskId && t.UserId == userId)).FirstOrDefault();
        if (task == null) return null;
        task.StartDate = dto.StartDate;
        task.EndDate = dto.EndDate;
        task.DueDate = dto.DueDate;
        _uow.TodoTasks.Update(task);
        await _uow.SaveChangesAsync();
        return await GetByIdAsync(userId, taskId);
    }

    public async Task<IEnumerable<TodoTaskDto>> SearchAsync(Guid userId, string query)
    {
        var lower = query.ToLower();
        var tasks = await _uow.TodoTasks.Query
            .Include(t => t.TodoTaskTags).ThenInclude(tt => tt.Tag)
            .Where(t => t.UserId == userId &&
                (t.Title.ToLower().Contains(lower) ||
                 (t.Description != null && t.Description.ToLower().Contains(lower)) ||
                 t.TodoTaskTags.Any(tt => tt.Tag.Name.ToLower().Contains(lower))))
            .ToListAsync();
        return _mapper.Map<IEnumerable<TodoTaskDto>>(tasks);
    }
}

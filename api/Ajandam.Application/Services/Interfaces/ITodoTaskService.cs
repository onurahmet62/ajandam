using Ajandam.Application.DTOs.Tasks;
namespace Ajandam.Application.Services.Interfaces;
public interface ITodoTaskService
{
    Task<TodoTaskDto> CreateAsync(Guid userId, CreateTodoTaskDto dto);
    Task<TodoTaskDto?> GetByIdAsync(Guid userId, Guid taskId);
    Task<IEnumerable<TodoTaskDto>> GetAllAsync(Guid userId);
    Task<IEnumerable<TodoTaskDto>> GetByDateRangeAsync(Guid userId, DateTime start, DateTime end);
    Task<TodoTaskDto?> UpdateAsync(Guid userId, Guid taskId, UpdateTodoTaskDto dto);
    Task<bool> DeleteAsync(Guid userId, Guid taskId);
    Task<TodoTaskDto?> RescheduleAsync(Guid userId, Guid taskId, RescheduleTaskDto dto);
    Task<IEnumerable<TodoTaskDto>> SearchAsync(Guid userId, string query);
}

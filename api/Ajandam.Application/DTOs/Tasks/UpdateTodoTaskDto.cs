using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Tasks;
public record UpdateTodoTaskDto(
    string? Title, string? Description, Priority? Priority, TodoStatus? Status,
    DateTime? DueDate, DateTime? StartDate, DateTime? EndDate,
    List<Guid>? TagIds);

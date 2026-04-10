using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Tasks;
public record CreateTodoTaskDto(
    string Title, string? Description, Priority Priority,
    DateTime? DueDate, DateTime? StartDate, DateTime? EndDate,
    RecurrenceType RecurrenceType = RecurrenceType.None, int RecurrenceInterval = 1, DateTime? RecurrenceEndDate = null,
    List<Guid>? TagIds = null);

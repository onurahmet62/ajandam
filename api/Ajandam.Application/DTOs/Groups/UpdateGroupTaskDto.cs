using Ajandam.Core.Enums;

namespace Ajandam.Application.DTOs.Groups;

public record UpdateGroupTaskDto(
    string? Title,
    string? Description,
    Priority? Priority,
    TodoStatus? Status,
    DateTime? DueDate,
    DateTime? StartDate,
    DateTime? EndDate,
    bool? AssignedToAll,
    List<Guid>? AssigneeUserIds
);

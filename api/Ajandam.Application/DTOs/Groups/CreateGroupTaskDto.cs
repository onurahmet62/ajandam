using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Groups;
public record CreateGroupTaskDto(string Title, string? Description, Priority Priority, DateTime? DueDate, DateTime? StartDate, DateTime? EndDate, Guid? AssignedToUserId);

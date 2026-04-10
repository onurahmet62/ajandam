using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Templates;
public record CreateTaskTemplateDto(string Name, string Title, string? Description, Priority Priority, string? DefaultTags);

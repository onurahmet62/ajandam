using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Templates;

public class TaskTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public string? DefaultTags { get; set; }
    public DateTime CreatedAt { get; set; }
}

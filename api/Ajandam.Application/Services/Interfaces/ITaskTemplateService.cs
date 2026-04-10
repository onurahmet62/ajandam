using Ajandam.Application.DTOs.Templates;
namespace Ajandam.Application.Services.Interfaces;
public interface ITaskTemplateService
{
    Task<TaskTemplateDto> CreateAsync(Guid userId, CreateTaskTemplateDto dto);
    Task<IEnumerable<TaskTemplateDto>> GetAllAsync(Guid userId);
    Task<bool> DeleteAsync(Guid userId, Guid templateId);
}

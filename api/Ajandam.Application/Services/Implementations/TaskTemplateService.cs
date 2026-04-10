using AutoMapper;
using Ajandam.Application.DTOs.Templates;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class TaskTemplateService : ITaskTemplateService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public TaskTemplateService(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }

    public async Task<TaskTemplateDto> CreateAsync(Guid userId, CreateTaskTemplateDto dto)
    {
        var template = new TaskTemplate
        {
            Name = dto.Name, Title = dto.Title, Description = dto.Description,
            Priority = dto.Priority, DefaultTags = dto.DefaultTags, UserId = userId
        };
        await _uow.TaskTemplates.AddAsync(template);
        await _uow.SaveChangesAsync();
        return _mapper.Map<TaskTemplateDto>(template);
    }

    public async Task<IEnumerable<TaskTemplateDto>> GetAllAsync(Guid userId)
    {
        var templates = await _uow.TaskTemplates.FindAsync(t => t.UserId == userId);
        return _mapper.Map<IEnumerable<TaskTemplateDto>>(templates);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid templateId)
    {
        var template = (await _uow.TaskTemplates.FindAsync(t => t.Id == templateId && t.UserId == userId)).FirstOrDefault();
        if (template == null) return false;
        _uow.TaskTemplates.Delete(template);
        await _uow.SaveChangesAsync();
        return true;
    }
}

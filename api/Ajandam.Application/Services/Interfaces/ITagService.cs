using Ajandam.Application.DTOs.Tags;
using Ajandam.Application.DTOs.Tasks;
namespace Ajandam.Application.Services.Interfaces;
public interface ITagService
{
    Task<TagDto> CreateAsync(Guid userId, CreateTagDto dto);
    Task<IEnumerable<TagDto>> GetAllAsync(Guid userId);
    Task<TagDto?> UpdateAsync(Guid userId, Guid tagId, UpdateTagDto dto);
    Task<bool> DeleteAsync(Guid userId, Guid tagId);
}

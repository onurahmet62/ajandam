using Ajandam.Application.DTOs.Tags;
using Ajandam.Application.DTOs.Tasks;
using Ajandam.Application.Services.Interfaces;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;

namespace Ajandam.Application.Services.Implementations;

public class TagService : ITagService
{
    private readonly IUnitOfWork _uow;

    public TagService(IUnitOfWork uow) => _uow = uow;

    public async Task<TagDto> CreateAsync(Guid userId, CreateTagDto dto)
    {
        var tag = new Tag { Name = dto.Name, Color = dto.Color, UserId = userId };
        await _uow.Tags.AddAsync(tag);
        await _uow.SaveChangesAsync();
        return MapTag(tag);
    }

    public async Task<IEnumerable<TagDto>> GetAllAsync(Guid userId)
    {
        var tags = await _uow.Tags.FindAsync(t => t.UserId == userId);
        return tags.Select(MapTag);
    }

    public async Task<TagDto?> UpdateAsync(Guid userId, Guid tagId, UpdateTagDto dto)
    {
        var tag = (await _uow.Tags.FindAsync(t => t.Id == tagId && t.UserId == userId)).FirstOrDefault();
        if (tag == null) return null;
        if (dto.Name != null) tag.Name = dto.Name;
        if (dto.Color != null) tag.Color = dto.Color;
        _uow.Tags.Update(tag);
        await _uow.SaveChangesAsync();
        return MapTag(tag);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid tagId)
    {
        var tag = (await _uow.Tags.FindAsync(t => t.Id == tagId && t.UserId == userId)).FirstOrDefault();
        if (tag == null) return false;
        _uow.Tags.Delete(tag);
        await _uow.SaveChangesAsync();
        return true;
    }

    private static TagDto MapTag(Tag t) => new() { Id = t.Id, Name = t.Name, Color = t.Color };
}

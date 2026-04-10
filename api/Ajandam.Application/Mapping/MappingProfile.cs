using AutoMapper;
using Ajandam.Core.Entities;
using Ajandam.Application.DTOs.Tasks;
using Ajandam.Application.DTOs.Notes;
using Ajandam.Application.DTOs.Journal;
using Ajandam.Application.DTOs.Countdowns;
using Ajandam.Application.DTOs.Groups;
using Ajandam.Application.DTOs.Templates;
using Ajandam.Application.DTOs.Auth;

namespace Ajandam.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<TodoTask, TodoTaskDto>()
            .ForMember(d => d.Tags, opt => opt.MapFrom(s => s.TodoTaskTags.Select(tt => tt.Tag)));
        CreateMap<Tag, TagDto>();
        CreateMap<Note, NoteDto>();
        CreateMap<JournalEntry, JournalEntryDto>();
        CreateMap<Countdown, CountdownDto>();
        CreateMap<GroupTask, GroupTaskDto>()
            .ForMember(d => d.AssignedToUserName, opt => opt.MapFrom(s => s.AssignedToUser != null ? s.AssignedToUser.FullName : null));
        CreateMap<TaskTemplate, TaskTemplateDto>();
        CreateMap<User, UserProfileDto>();
    }
}

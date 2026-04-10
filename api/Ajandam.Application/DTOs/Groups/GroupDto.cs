using Ajandam.Core.Enums;
namespace Ajandam.Application.DTOs.Groups;
public record GroupDto(Guid Id, string Name, string? Description, List<GroupMemberDto> Members, DateTime CreatedAt);
public record GroupMemberDto(Guid UserId, string FullName, string Email, GroupRole Role);

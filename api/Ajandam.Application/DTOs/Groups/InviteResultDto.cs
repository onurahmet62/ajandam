namespace Ajandam.Application.DTOs.Groups;

public record InviteResultDto(bool AddedDirectly, string? InvitationLink, string Message);

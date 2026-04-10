using Ajandam.Core.Enums;

namespace Ajandam.Application.DTOs.Groups;

public record GroupInvitationDto(
    Guid Id,
    Guid GroupId,
    string GroupName,
    string Email,
    string InvitedByName,
    InvitationStatus Status,
    DateTime CreatedAt
);

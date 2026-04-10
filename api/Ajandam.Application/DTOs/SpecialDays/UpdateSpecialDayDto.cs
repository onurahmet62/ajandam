namespace Ajandam.Application.DTOs.SpecialDays;

public record UpdateSpecialDayDto(string? Title, DateTime? Date, bool? IsYearly, string? Color);

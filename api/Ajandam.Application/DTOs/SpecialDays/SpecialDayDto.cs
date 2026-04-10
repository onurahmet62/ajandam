namespace Ajandam.Application.DTOs.SpecialDays;

public record SpecialDayDto(Guid Id, string Title, DateTime Date, bool IsYearly, string Color);

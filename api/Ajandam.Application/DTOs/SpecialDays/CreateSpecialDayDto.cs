namespace Ajandam.Application.DTOs.SpecialDays;

public record CreateSpecialDayDto(string Title, DateTime Date, bool IsYearly = true, string Color = "#EC4899");

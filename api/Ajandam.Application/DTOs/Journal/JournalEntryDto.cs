namespace Ajandam.Application.DTOs.Journal;

public class JournalEntryDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = "";
    public DateTime Date { get; set; }
    public string? Mood { get; set; }
    public DateTime CreatedAt { get; set; }
}

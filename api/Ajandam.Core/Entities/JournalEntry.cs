namespace Ajandam.Core.Entities;

public class JournalEntry : BaseEntity
{
    public string Content { get; set; } = default!;
    public DateTime Date { get; set; }
    public string? Mood { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}

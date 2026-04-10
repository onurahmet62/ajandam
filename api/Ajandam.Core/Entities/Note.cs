namespace Ajandam.Core.Entities;

public class Note : BaseEntity
{
    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;
    public DateTime Date { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}

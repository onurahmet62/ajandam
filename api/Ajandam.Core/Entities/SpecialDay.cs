namespace Ajandam.Core.Entities;

public class SpecialDay : BaseEntity
{
    public string Title { get; set; } = default!;
    public DateTime Date { get; set; }
    public bool IsYearly { get; set; } = true;
    public string Color { get; set; } = "#EC4899"; // pink default
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}

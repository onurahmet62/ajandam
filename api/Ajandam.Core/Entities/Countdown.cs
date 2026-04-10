namespace Ajandam.Core.Entities;

public class Countdown : BaseEntity
{
    public string Title { get; set; } = default!;
    public DateTime TargetDate { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
}

namespace Ajandam.Application.DTOs.Countdowns;

public class CountdownDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public DateTime TargetDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

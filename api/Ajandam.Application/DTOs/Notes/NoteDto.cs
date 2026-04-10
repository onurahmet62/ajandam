namespace Ajandam.Application.DTOs.Notes;

public class NoteDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }
}

namespace Ajandam.Core.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string ThemeColor { get; set; } = "#A7C7E7";

    public List<TodoTask> Tasks { get; set; } = new();
    public List<Note> Notes { get; set; } = new();
    public List<JournalEntry> JournalEntries { get; set; } = new();
    public List<Countdown> Countdowns { get; set; } = new();
    public List<Tag> Tags { get; set; } = new();
    public List<UserGroup> UserGroups { get; set; } = new();
    public List<TaskTemplate> TaskTemplates { get; set; } = new();
}

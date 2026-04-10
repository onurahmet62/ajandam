using Ajandam.Core.Entities;

namespace Ajandam.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<TodoTask> TodoTasks { get; }
    IRepository<Tag> Tags { get; }
    IRepository<Note> Notes { get; }
    IRepository<JournalEntry> JournalEntries { get; }
    IRepository<Countdown> Countdowns { get; }
    IRepository<Group> Groups { get; }
    IRepository<GroupTask> GroupTasks { get; }
    IRepository<TaskTemplate> TaskTemplates { get; }
    IRepository<GroupInvitation> GroupInvitations { get; }
    Task<int> SaveChangesAsync();
}

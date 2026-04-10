using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;
using Ajandam.Infrastructure.Data;

namespace Ajandam.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AjandamDbContext _context;
    private IRepository<User>? _users;
    private IRepository<TodoTask>? _todoTasks;
    private IRepository<Tag>? _tags;
    private IRepository<Note>? _notes;
    private IRepository<JournalEntry>? _journalEntries;
    private IRepository<Countdown>? _countdowns;
    private IRepository<Group>? _groups;
    private IRepository<GroupTask>? _groupTasks;
    private IRepository<TaskTemplate>? _taskTemplates;
    private IRepository<GroupInvitation>? _groupInvitations;
    private IRepository<SpecialDay>? _specialDays;

    public UnitOfWork(AjandamDbContext context)
    {
        _context = context;
    }

    public IRepository<User> Users => _users ??= new Repository<User>(_context);
    public IRepository<TodoTask> TodoTasks => _todoTasks ??= new Repository<TodoTask>(_context);
    public IRepository<Tag> Tags => _tags ??= new Repository<Tag>(_context);
    public IRepository<Note> Notes => _notes ??= new Repository<Note>(_context);
    public IRepository<JournalEntry> JournalEntries => _journalEntries ??= new Repository<JournalEntry>(_context);
    public IRepository<Countdown> Countdowns => _countdowns ??= new Repository<Countdown>(_context);
    public IRepository<Group> Groups => _groups ??= new Repository<Group>(_context);
    public IRepository<GroupTask> GroupTasks => _groupTasks ??= new Repository<GroupTask>(_context);
    public IRepository<TaskTemplate> TaskTemplates => _taskTemplates ??= new Repository<TaskTemplate>(_context);
    public IRepository<GroupInvitation> GroupInvitations => _groupInvitations ??= new Repository<GroupInvitation>(_context);
    public IRepository<SpecialDay> SpecialDays => _specialDays ??= new Repository<SpecialDay>(_context);

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
}

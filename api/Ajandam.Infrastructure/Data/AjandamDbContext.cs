using Microsoft.EntityFrameworkCore;
using Ajandam.Core.Entities;

namespace Ajandam.Infrastructure.Data;

public class AjandamDbContext : DbContext
{
    public AjandamDbContext(DbContextOptions<AjandamDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<TodoTask> TodoTasks => Set<TodoTask>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<TodoTaskTag> TodoTaskTags => Set<TodoTaskTag>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<Countdown> Countdowns => Set<Countdown>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<GroupTask> GroupTasks => Set<GroupTask>();
    public DbSet<TaskTemplate> TaskTemplates => Set<TaskTemplate>();
    public DbSet<GroupInvitation> GroupInvitations => Set<GroupInvitation>();
    public DbSet<GroupTaskAssignee> GroupTaskAssignees => Set<GroupTaskAssignee>();
    public DbSet<SpecialDay> SpecialDays => Set<SpecialDay>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // TodoTaskTag composite key
        modelBuilder.Entity<TodoTaskTag>()
            .HasKey(tt => new { tt.TodoTaskId, tt.TagId });

        modelBuilder.Entity<TodoTaskTag>()
            .HasOne(tt => tt.TodoTask)
            .WithMany(t => t.TodoTaskTags)
            .HasForeignKey(tt => tt.TodoTaskId);

        modelBuilder.Entity<TodoTaskTag>()
            .HasOne(tt => tt.Tag)
            .WithMany(t => t.TodoTaskTags)
            .HasForeignKey(tt => tt.TagId);

        // UserGroup composite key
        modelBuilder.Entity<UserGroup>()
            .HasKey(ug => new { ug.UserId, ug.GroupId });

        modelBuilder.Entity<UserGroup>()
            .HasOne(ug => ug.User)
            .WithMany(u => u.UserGroups)
            .HasForeignKey(ug => ug.UserId);

        modelBuilder.Entity<UserGroup>()
            .HasOne(ug => ug.Group)
            .WithMany(g => g.UserGroups)
            .HasForeignKey(ug => ug.GroupId);

        // User email unique index
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // GroupTask relationships
        modelBuilder.Entity<GroupTask>()
            .HasOne(gt => gt.Group)
            .WithMany(g => g.GroupTasks)
            .HasForeignKey(gt => gt.GroupId);

        modelBuilder.Entity<GroupTask>()
            .HasOne(gt => gt.AssignedToUser)
            .WithMany()
            .HasForeignKey(gt => gt.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<GroupTask>()
            .HasOne(gt => gt.CreatedByUser)
            .WithMany()
            .HasForeignKey(gt => gt.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // GroupTaskAssignee composite key
        modelBuilder.Entity<GroupTaskAssignee>()
            .HasKey(gta => new { gta.GroupTaskId, gta.UserId });

        modelBuilder.Entity<GroupTaskAssignee>()
            .HasOne(gta => gta.GroupTask)
            .WithMany(gt => gt.Assignees)
            .HasForeignKey(gta => gta.GroupTaskId);

        modelBuilder.Entity<GroupTaskAssignee>()
            .HasOne(gta => gta.User)
            .WithMany(u => u.GroupTaskAssignments)
            .HasForeignKey(gta => gta.UserId);

        // GroupInvitation relationships
        modelBuilder.Entity<GroupInvitation>()
            .HasOne(gi => gi.Group)
            .WithMany(g => g.Invitations)
            .HasForeignKey(gi => gi.GroupId);

        modelBuilder.Entity<GroupInvitation>()
            .HasOne(gi => gi.InvitedByUser)
            .WithMany()
            .HasForeignKey(gi => gi.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GroupInvitation>()
            .HasIndex(gi => gi.Token)
            .IsUnique();

        // TodoTask self-referencing for recurring
        modelBuilder.Entity<TodoTask>()
            .HasOne<TodoTask>()
            .WithMany()
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.SetNull);

        // Global query filters for soft delete
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TodoTask>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Tag>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Note>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<JournalEntry>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Countdown>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Group>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<GroupTask>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TaskTemplate>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<GroupInvitation>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SpecialDay>().HasQueryFilter(e => !e.IsDeleted);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = DateTime.UtcNow;
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}

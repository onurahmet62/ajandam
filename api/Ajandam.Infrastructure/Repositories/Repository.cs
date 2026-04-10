using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Ajandam.Core.Entities;
using Ajandam.Core.Interfaces;
using Ajandam.Infrastructure.Data;

namespace Ajandam.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AjandamDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AjandamDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public IQueryable<T> Query => _dbSet.AsQueryable();

    public async Task<T?> GetByIdAsync(Guid id) => await _dbSet.FindAsync(id);
    public async Task<List<T>> GetAllAsync() => await _dbSet.ToListAsync();
    public async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate) => await _dbSet.Where(predicate).ToListAsync();
    public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);
    public void Update(T entity) => _dbSet.Update(entity);
    public void Delete(T entity)
    {
        entity.IsDeleted = true;
        _dbSet.Update(entity);
    }
}

using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public sealed class GenericRepository<T>(AppDbContext dbContext) : IRepository<T> where T : BaseEntity
{
    public IQueryable<T> Query() => dbContext.Set<T>().AsQueryable();
    public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => dbContext.Set<T>().FindAsync([id], cancellationToken).AsTask();
    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) => await dbContext.Set<T>().AddAsync(entity, cancellationToken);
    public void Update(T entity) => dbContext.Set<T>().Update(entity);
    public void Remove(T entity) => dbContext.Set<T>().Remove(entity);
}

public sealed class UnitOfWork(AppDbContext dbContext) : IUnitOfWork
{
    private readonly Dictionary<Type, object> _repositories = [];

    public IRepository<T> Repository<T>() where T : BaseEntity
    {
        if (_repositories.TryGetValue(typeof(T), out var repository))
            return (IRepository<T>)repository;

        var created = new GenericRepository<T>(dbContext);
        _repositories[typeof(T)] = created;
        return created;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);
}


using FluentValidation;
using MediatR;

namespace Application.Common;

public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var errors = validators
            .Select(x => x.Validate(context))
            .SelectMany(x => x.Errors)
            .Where(x => x is not null)
            .Select(x => x.ErrorMessage)
            .Distinct()
            .ToList();

        if (errors.Count > 0)
            throw new ValidationException(errors.Select(x => new FluentValidation.Results.ValidationFailure(string.Empty, x)));

        return await next();
    }
}

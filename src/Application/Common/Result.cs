namespace Application.Common;

public sealed record Result<T>(bool Succeeded, T? Data, string? Error, IReadOnlyList<string> Errors)
{
    public static Result<T> Success(T data) => new(true, data, null, []);
    public static Result<T> Failure(string error) => new(false, default, error, [error]);
    public static Result<T> Failure(IReadOnlyList<string> errors) => new(false, default, errors.FirstOrDefault(), errors);
}

public sealed record ApiResponse<T>(bool Success, T? Data, string? Message, IReadOnlyList<string> Errors)
{
    public static ApiResponse<T> From(Result<T> result) =>
        new(result.Succeeded, result.Data, result.Error, result.Errors);
}

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class PagedQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool Descending { get; set; }
}


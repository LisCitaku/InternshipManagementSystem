import type { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function Table<T extends object>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/6 bg-white/70 shadow-[0_18px_45px_-25px_rgba(36,51,79,0.16)] dark:border-white/8 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-black/[0.025] text-ink-500 dark:bg-white/[0.03] dark:text-ink-200">
            <tr>
              {columns.map((column) => (
                <th key={column.key.toString()} className="px-4 py-3 font-semibold uppercase tracking-[0.08em]">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-black/6 transition hover:bg-black/[0.03] dark:border-white/8 dark:hover:bg-white/[0.04]"
              >
                {columns.map((column) => (
                  <td key={column.key.toString()} className="px-4 py-3 align-middle text-ink-700 dark:text-ink-200">
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key.toString()] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-ink-500 dark:text-ink-300" colSpan={columns.length}>
                  No rows found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

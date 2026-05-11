import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/6 bg-white/60 px-4 py-3 dark:border-white/8 dark:bg-white/[0.03]">
      <span className="text-sm text-ink-600 dark:text-ink-300">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

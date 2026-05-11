import type { ReactNode } from 'react';
import { Filters } from '@/components/Filters';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import type { Option } from '@/types';

interface TablePageProps {
  title: string;
  description: string;
  search: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: Option[];
  table: ReactNode;
  action?: ReactNode;
}

export function TablePage({
  title,
  description,
  search,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  table,
  action,
}: TablePageProps) {
  return (
    <div className="space-y-5">
      <SectionHeader title={title} description={description} action={action} />
      <div className="glass-panel space-y-4 rounded-2xl p-5 shadow-[0_20px_60px_-40px_rgba(36,51,79,0.24)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <SearchBar value={search} onChange={onSearchChange} />
          <Filters options={filterOptions} value={filterValue} onChange={onFilterChange} />
        </div>
        {table}
      </div>
    </div>
  );
}

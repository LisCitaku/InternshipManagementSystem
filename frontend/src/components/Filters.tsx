import type { Option } from '@/types';

interface FiltersProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function Filters({ options, value, onChange }: FiltersProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm shadow-[0_14px_32px_-28px_rgba(36,51,79,0.28)] transition focus-within:border-sky-500/40 focus-within:ring-4 focus-within:ring-sky-500/10 dark:border-white/10 dark:bg-white/6">
      <Search size={18} className="text-ink-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none"
      />
    </label>
  );
}

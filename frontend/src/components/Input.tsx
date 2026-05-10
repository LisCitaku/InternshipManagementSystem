import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        className={cn(
          'rounded-lg border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/12 dark:border-white/10 dark:bg-white/6',
          error && 'border-coral-500 focus:border-coral-500 focus:ring-coral-500/10',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-coral-500">{error}</span> : null}
    </label>
  );
}


import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-gradient-to-r from-ink-950 to-ink-900 text-white shadow-[0_10px_24px_-10px_rgba(18,24,39,0.55)] hover:translate-y-[-1px] hover:from-ink-900 hover:to-ink-800 dark:from-white dark:to-ink-200 dark:text-ink-950',
        variant === 'secondary' && 'border border-sky-500/12 bg-sky-500/12 text-sky-700 hover:bg-sky-500/18 hover:translate-y-[-1px] dark:text-sky-200 dark:border-sky-400/10',
        variant === 'ghost' && 'bg-transparent text-ink-700 hover:bg-black/5 dark:text-white dark:hover:bg-white/8',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

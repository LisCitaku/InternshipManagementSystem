interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function Loader({ label = 'Loading', fullScreen = false }: LoaderProps) {
  return (
    <div className={fullScreen ? 'grid min-h-[55vh] place-items-center' : 'grid place-items-center py-8'}>
      <div className="flex items-center gap-3 rounded-full border border-black/6 bg-white/70 px-4 py-3 text-sm text-ink-600 shadow-[0_18px_50px_-30px_rgba(36,51,79,0.16)] dark:border-white/8 dark:bg-white/[0.03] dark:text-ink-200">
        <span className="size-3 animate-pulse rounded-full bg-sky-500" />
        <span>{label}</span>
      </div>
    </div>
  );
}

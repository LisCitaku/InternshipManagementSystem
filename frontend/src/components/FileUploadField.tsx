import { UploadCloud } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  accept?: string;
}

export function FileUploadField({ label, accept }: FileUploadFieldProps) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-black/12 bg-black/[0.02] px-4 py-6 text-center transition hover:border-sky-500/30 hover:bg-sky-500/[0.03] dark:border-white/12 dark:bg-white/[0.03]">
      <UploadCloud size={18} />
      <span className="text-sm font-medium">{label}</span>
      <input type="file" accept={accept} className="hidden" />
    </label>
  );
}

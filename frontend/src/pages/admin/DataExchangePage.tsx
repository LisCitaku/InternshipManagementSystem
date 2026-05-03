import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { dataTransferApi } from '@/api/dataTransferApi';

const entities = ['categories', 'companies', 'internships', 'applications', 'settings'] as const;
const formats = ['csv', 'json', 'xlsx'] as const;

type Entity = (typeof entities)[number];
type Format = (typeof formats)[number];

const entityLabels: Record<Entity, string> = {
  categories: 'Categories',
  companies: 'Companies',
  internships: 'Internships',
  applications: 'Applications',
  settings: 'Settings',
};

export default function DataExchangePage() {
  const [exportEntity, setExportEntity] = useState<Entity>('internships');
  const [exportFormat, setExportFormat] = useState<Format>('xlsx');
  const [importEntity, setImportEntity] = useState<Entity>('categories');
  const [importFormat, setImportFormat] = useState<Format>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('Ready');

  const handleExport = async () => {
    setStatus('Preparing download...');
    const response = await dataTransferApi.exportData({ entity: exportEntity, format: exportFormat });
    const contentType = String(response.headers['content-type'] ?? 'application/octet-stream');
    const blob = new Blob([response.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${exportEntity}.${exportFormat === 'xlsx' ? 'xlsx' : exportFormat}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${exportEntity} as ${exportFormat.toUpperCase()}`);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setStatus('Please choose a file first.');
      return;
    }

    setStatus('Importing records...');
    const response = await dataTransferApi.importData({
      entity: importEntity,
      format: importFormat,
      file: selectedFile,
    });
    const result = response.data.data;
    setStatus(`Imported ${result.upsertedRows}/${result.totalRows} rows into ${result.entity}.`);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Data Exchange"
        description="Export and import structured data for the key business lists used in the rubric."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-sm text-ink-600 dark:text-ink-300">Supported lists</div>
          <div className="mt-2 text-2xl font-semibold">5</div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-sm text-ink-600 dark:text-ink-300">Formats</div>
          <div className="mt-2 text-2xl font-semibold">CSV / JSON / XLSX</div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <div className="text-sm text-ink-600 dark:text-ink-300">Current status</div>
          <div className="mt-2 text-2xl font-semibold">{status}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel rounded-lg p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Download size={18} />
            Export
          </div>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
            Choose a list and export it directly for reporting, backup, or review.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2 text-sm">
              Entity
              <select
                className="rounded-lg border border-black/8 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/6"
                value={exportEntity}
                onChange={(event) => setExportEntity(event.target.value as Entity)}
              >
                {entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entityLabels[entity]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Format
              <select
                className="rounded-lg border border-black/8 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/6"
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as Format)}
              >
                {formats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={handleExport}>
              <Download size={16} />
              Download export
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Upload size={18} />
            Import
          </div>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
            Upload a CSV, JSON, or Excel file to insert or update records in bulk.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2 text-sm">
              Entity
              <select
                className="rounded-lg border border-black/8 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/6"
                value={importEntity}
                onChange={(event) => setImportEntity(event.target.value as Entity)}
              >
                {entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entityLabels[entity]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Format
              <select
                className="rounded-lg border border-black/8 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/6"
                value={importFormat}
                onChange={(event) => setImportFormat(event.target.value as Format)}
              >
                {formats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              File
              <input
                type="file"
                className="rounded-lg border border-black/8 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/6"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <Button onClick={handleImport}>
              <Upload size={16} />
              Import file
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4 text-sm text-ink-600 dark:text-ink-300">{status}</div>
    </div>
  );
}

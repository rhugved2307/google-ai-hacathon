import { FileSpreadsheet, FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { UploadedFileInfo } from '../engine/types';
import { formatBytes, MAX_FILE_SIZE_BYTES, readLocalFile } from '../utils/fileUtils';

interface FileUploadProps {
  uploadedFile: UploadedFileInfo | null;
  onFileLoaded: (content: string, info: UploadedFileInfo) => void;
  onRemoveFile: () => void;
  onError: (message: string) => void;
}

export function FileUpload({
  uploadedFile,
  onFileLoaded,
  onRemoveFile,
  onError,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsReading(true);
    try {
      const { content, info } = await readLocalFile(file);
      onFileLoaded(content, info);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to read the selected file.';
      onError(msg);
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.csv,text/plain,text/csv"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        className="sr-only"
        aria-label="Upload TXT or CSV file"
      />

      {uploadedFile ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/8 px-3.5 py-2.5 dark:border-[#8B5CF6]/45 dark:bg-[#1B2540]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#7C3AED] ring-1 ring-slate-200 dark:bg-[#141B2D] dark:text-[#22D3EE] dark:ring-[#283449]">
              {uploadedFile.type === 'csv' ? (
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {uploadedFile.name}
              </p>
              <p className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-[#94A3B8]">
                {uploadedFile.type.toUpperCase()} · {formatBytes(uploadedFile.size)} · Loaded locally
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] dark:border-[#283449] dark:bg-[#141B2D] dark:text-[#F8FAFC] dark:hover:border-[#8B5CF6]/60"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemoveFile}
              aria-label="Remove uploaded file"
              title="Remove uploaded file"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/15 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] dark:text-[#94A3B8] dark:hover:text-[#F87171]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDragging) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload a TXT or CSV file by clicking or dragging and dropping"
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
            isDragging
              ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 dark:border-[#A78BFA] dark:bg-[#8B5CF6]/15'
              : 'border-slate-300 bg-slate-50/70 hover:border-[#8B5CF6]/60 hover:bg-slate-100/70 dark:border-[#283449] dark:bg-[#0E1528] dark:hover:border-[#8B5CF6]/60 dark:hover:bg-[#1B2540]/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#8B5CF6] ring-1 ring-slate-200 dark:bg-[#1B2540] dark:text-[#A78BFA] dark:ring-[#283449]">
              <Upload className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-800 dark:text-[#F8FAFC]">
                {isReading
                  ? 'Reading file locally...'
                  : 'Drop a .txt or .csv file here, or click to upload'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Up to {formatBytes(MAX_FILE_SIZE_BYTES)} · Read locally in browser memory
              </p>
            </div>
          </div>

          <span className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 sm:inline-block shrink-0 dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC]">
            Browse File
          </span>
        </div>
      )}
    </div>
  );
}

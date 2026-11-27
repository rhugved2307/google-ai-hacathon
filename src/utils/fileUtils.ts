import type { UploadedFileInfo } from '../engine/types';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB client-side limit

export interface FileValidationResult {
  valid: boolean;
  fileType?: 'txt' | 'csv';
  error?: string;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function hasSuspiciousBinaryContent(content: string): boolean {
  if (content.includes('\0')) return true;
  const sampleLen = Math.min(content.length, 4096);
  if (sampleLen === 0) return false;
  let controlCount = 0;
  for (let i = 0; i < sampleLen; i++) {
    const code = content.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      controlCount += 1;
    }
  }
  return controlCount / sampleLen > 0.02;
}

export function validateUploadedFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file was provided.' };
  }

  const lowerName = file.name.trim().toLowerCase();
  const hasDot = lowerName.includes('.');
  const isTxtExt = lowerName.endsWith('.txt');
  const isCsvExt = lowerName.endsWith('.csv');

  // If the file has an explicit extension, strictly require .txt or .csv (prevents spoofed MIME on .html/.exe/.svg)
  if (hasDot && !isTxtExt && !isCsvExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a .txt or .csv file.',
    };
  }

  const isTxt = isTxtExt || (!hasDot && file.type === 'text/plain');
  const isCsv =
    isCsvExt ||
    (!hasDot && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'));

  if (!isTxt && !isCsv) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a .txt or .csv file.',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty. Please upload a file containing text or CSV rows.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds the ${formatBytes(MAX_FILE_SIZE_BYTES)} local processing limit.`,
    };
  }

  return {
    valid: true,
    fileType: isCsv ? 'csv' : 'txt',
  };
}

export async function readLocalFile(file: File): Promise<{
  content: string;
  info: UploadedFileInfo;
}> {
  const validation = validateUploadedFile(file);
  if (!validation.valid || !validation.fileType) {
    throw new Error(validation.error || 'Invalid file.');
  }

  const content = await file.text();
  if (!content.trim()) {
    throw new Error('The uploaded file contains only whitespace.');
  }
  if (hasSuspiciousBinaryContent(content)) {
    throw new Error(
      'The file appears to contain binary or corrupted data. Please upload a valid plain-text .txt or .csv file.'
    );
  }

  return {
    content,
    info: {
      name: file.name,
      size: file.size,
      type: validation.fileType,
      lastModified: file.lastModified,
    },
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

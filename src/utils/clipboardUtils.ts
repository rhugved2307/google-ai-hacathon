export interface CopyResult {
  success: boolean;
  error?: string;
}

/**
 * Copies text to clipboard using the modern Clipboard API with a safe textarea fallback.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (!text) {
    return { success: false, error: 'Nothing to copy.' };
  }

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return { success: true };
    }
  } catch {
    // Fall through to legacy fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (ok) {
      return { success: true };
    }
    return { success: false, error: 'Clipboard access was blocked by the browser.' };
  } catch {
    return { success: false, error: 'Unable to access the clipboard in this environment.' };
  }
}

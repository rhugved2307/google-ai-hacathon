export interface StorageAuditCounts {
  readonly localStorageCount: number;
  readonly sessionStorageCount: number;
  readonly totalKeys: number;
}

/**
 * Safely reads browser storage key counts without throwing in sandboxed/restricted contexts.
 * VELTRIX itself writes zero keys to localStorage or sessionStorage.
 */
export function getBrowserStorageCounts(): StorageAuditCounts {
  let localStorageCount = 0;
  let sessionStorageCount = 0;

  if (typeof window !== 'undefined') {
    try {
      localStorageCount = window.localStorage.length;
    } catch {
      localStorageCount = 0;
    }
    try {
      sessionStorageCount = window.sessionStorage.length;
    } catch {
      sessionStorageCount = 0;
    }
  }

  return {
    localStorageCount,
    sessionStorageCount,
    totalKeys: localStorageCount + sessionStorageCount,
  };
}

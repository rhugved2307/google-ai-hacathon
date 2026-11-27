import { Copy, ScanSearch, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CSVAnalysis } from './components/CSVAnalysis';
import { DetectionInsights } from './components/DetectionInsights';
import { Navbar, type AppPage } from './components/Navbar';
import {
  HR_EXPORT_PRESET,
  OverviewDashboard,
  SUPPORT_LOG_PRESET,
} from './components/OverviewDashboard';
import { PrivacyModal } from './components/PrivacyModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { StatsCards } from './components/StatsCards';
import { ToastStack, type ToastMessage } from './components/Toast';
import { Workspace } from './components/Workspace';
import { DEMO_CSV_SAMPLE, DEMO_TEXT_SAMPLE } from './engine/demoData';
import type { PIICategory, UploadedFileInfo } from './engine/types';
import { useScanner } from './hooks/useScanner';
import { useTheme } from './hooks/useTheme';
import { copyToClipboard } from './utils/clipboardUtils';
import {
  downloadSanitizedCsv,
  downloadSanitizedTxt,
  downloadSummaryReport,
} from './utils/downloadUtils';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const scanner = useScanner();

  const [activePage, setActivePage] = useState<AppPage>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [leftViewMode, setLeftViewMode] = useState<'edit' | 'highlight'>('edit');
  const [mobileTab, setMobileTab] = useState<'original' | 'sanitized'>('original');
  const [showHighlights, setShowHighlights] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<PIICategory | 'ALL'>('ALL');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');

  const pushToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      setStatusAnnouncement(description ? `${title}. ${description}` : title);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleScan = useCallback(() => {
    if (!scanner.rawText.trim()) {
      pushToast('error', 'Input is empty', 'Paste text or upload a file before scanning.');
      return;
    }
    const result = scanner.executeScan();
    if (result) {
      setActiveCategoryFilter('ALL');
      setLeftViewMode('highlight');
      setShowHighlights(true);
      setMobileTab('sanitized');
      pushToast(
        'success',
        'Local scan complete',
        result.stats.totalDetections > 0
          ? `${result.stats.totalDetections} sensitive finding${result.stats.totalDetections === 1 ? '' : 's'} redacted across ${result.stats.uniqueCategories} categor${result.stats.uniqueCategories === 1 ? 'y' : 'ies'}.`
          : 'No matching PII patterns were found in this input.'
      );
    }
  }, [scanner, pushToast]);

  // Keyboard shortcut: Ctrl/Cmd + Enter triggers Scan & Sanitize in workspace view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (activePage === 'workspace' && scanner.rawText.trim()) {
          e.preventDefault();
          handleScan();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePage, scanner.rawText, handleScan]);

  const handleOpenWorkspace = useCallback(() => {
    setActivePage('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuickUploadClick = useCallback(() => {
    setActivePage('workspace');
    setLeftViewMode('edit');
    setMobileTab('original');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLoadAndScanPreset = useCallback(
    (preset: 'demo-text' | 'demo-csv' | 'support-log' | 'hr-export') => {
      let content = DEMO_TEXT_SAMPLE;
      let fileInfo: UploadedFileInfo;

      if (preset === 'demo-csv') {
        content = DEMO_CSV_SAMPLE;
        fileInfo = {
          name: 'customer-files-sample.csv',
          size: new Blob([content]).size,
          type: 'csv',
          lastModified: Date.now(),
        };
      } else if (preset === 'support-log') {
        content = SUPPORT_LOG_PRESET;
        fileInfo = {
          name: 'support-ticket-4821.log',
          size: new Blob([content]).size,
          type: 'txt',
          lastModified: Date.now(),
        };
      } else if (preset === 'hr-export') {
        content = HR_EXPORT_PRESET;
        fileInfo = {
          name: 'hr-onboarding-record.txt',
          size: new Blob([content]).size,
          type: 'txt',
          lastModified: Date.now(),
        };
      } else {
        content = DEMO_TEXT_SAMPLE;
        fileInfo = {
          name: 'customer-kyc-profile.txt',
          size: new Blob([content]).size,
          type: 'txt',
          lastModified: Date.now(),
        };
      }

      scanner.loadFile(content, fileInfo);
      const result = scanner.executeScan({
        textOverride: content,
        csvModeOverride: fileInfo.type === 'csv',
        fileOverride: fileInfo,
        selectedColsOverride: undefined,
      });

      setActiveCategoryFilter('ALL');
      setLeftViewMode('highlight');
      setShowHighlights(true);
      setMobileTab('sanitized');
      setActivePage('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (result) {
        pushToast(
          'success',
          `${fileInfo.name} scanned locally`,
          `${result.stats.totalDetections} sensitive finding${result.stats.totalDetections === 1 ? '' : 's'} highlighted and sanitized on your device.`
        );
      }
    },
    [scanner, pushToast]
  );

  const handleFileLoaded = useCallback(
    (content: string, info: UploadedFileInfo) => {
      scanner.loadFile(content, info);
      setLeftViewMode('edit');
      setMobileTab('original');
      setActiveCategoryFilter('ALL');
      pushToast(
        'success',
        `${info.type.toUpperCase()} file loaded locally`,
        `${info.name} is ready to scan on your device.`
      );
    },
    [scanner, pushToast]
  );

  const handleRemoveFile = useCallback(() => {
    scanner.removeFile();
    setLeftViewMode('edit');
    setActiveCategoryFilter('ALL');
    pushToast('info', 'File removed', 'Uploaded file content was cleared from memory.');
  }, [scanner, pushToast]);

  const handleLoadDemoText = useCallback(() => {
    scanner.loadDemoText();
    setLeftViewMode('edit');
    setMobileTab('original');
    setActiveCategoryFilter('ALL');
    pushToast(
      'info',
      'Fictional sample loaded',
      'Click "Scan & Sanitize" to highlight and redact all sample fields.'
    );
  }, [scanner, pushToast]);

  const handleLoadDemoCSV = useCallback(() => {
    scanner.loadDemoCSV();
    setLeftViewMode('edit');
    setMobileTab('original');
    setActiveCategoryFilter('ALL');
    pushToast(
      'info',
      'Fictional sample CSV loaded',
      'Click "Scan & Sanitize" to inspect CSV column statistics and preview.'
    );
  }, [scanner, pushToast]);

  const handleClearAll = useCallback(() => {
    scanner.clearAll();
    setLeftViewMode('edit');
    setMobileTab('original');
    setActiveCategoryFilter('ALL');
    pushToast('info', 'Workspace cleared', 'All input and scan state wiped from browser memory.');
  }, [scanner, pushToast]);

  const handleUndo = useCallback(() => {
    const restored = scanner.undoLastAction();
    if (restored) {
      pushToast('info', 'Action undone', 'Previous workspace state restored.');
    }
  }, [scanner, pushToast]);

  const handleCopyOriginal = useCallback(async () => {
    const res = await copyToClipboard(scanner.rawText);
    if (res.success) {
      pushToast('success', 'Original text copied');
    } else {
      pushToast('error', 'Clipboard error', res.error);
    }
  }, [scanner.rawText, pushToast]);

  const handleCopySanitized = useCallback(async () => {
    const output = scanner.scanResult?.sanitizedText ?? '';
    const res = await copyToClipboard(output);
    if (res.success) {
      pushToast('success', 'Sanitized output copied', 'Clean text copied to your clipboard.');
    } else {
      pushToast('error', 'Clipboard error', res.error);
    }
  }, [scanner.scanResult, pushToast]);

  const handleDownloadTxt = useCallback(() => {
    const output = scanner.scanResult?.sanitizedText ?? '';
    if (!output) return;
    downloadSanitizedTxt(output, scanner.uploadedFile?.name);
    pushToast('success', 'TXT downloaded', 'Sanitized text exported locally.');
  }, [scanner.scanResult, scanner.uploadedFile, pushToast]);

  const handleDownloadCsv = useCallback(() => {
    const output = scanner.csvResult?.sanitizedCSV ?? '';
    if (!output) return;
    downloadSanitizedCsv(output, scanner.uploadedFile?.name);
    pushToast('success', 'CSV downloaded', 'Sanitized CSV exported with structure intact.');
  }, [scanner.csvResult, scanner.uploadedFile, pushToast]);

  const handleDownloadReport = useCallback(() => {
    if (!scanner.scanResult) return;
    downloadSummaryReport({
      sourceName:
        scanner.uploadedFile?.name ||
        (scanner.isCSVMode ? 'sample-csv-data' : 'pasted-text'),
      sourceType: scanner.uploadedFile?.type || (scanner.isCSVMode ? 'csv' : 'text'),
      redactionMode: scanner.redactionMode,
      result: scanner.scanResult,
      csvResult: scanner.csvResult,
    });
    pushToast('success', 'Summary report downloaded', 'Metrics only — zero raw PII exposed.');
  }, [scanner, pushToast]);

  const handleResetSettings = useCallback(() => {
    scanner.resetSettings();
    pushToast('info', 'Settings reset', 'All modes, detectors, and rules restored to defaults.');
  }, [scanner, pushToast]);

  const handleResetSession = useCallback(() => {
    scanner.clearAll();
    scanner.resetSettings();
    setSearchQuery('');
    setLeftViewMode('edit');
    setMobileTab('original');
    setShowHighlights(true);
    setActiveCategoryFilter('ALL');
    pushToast(
      'info',
      'Session & demo data reset',
      'Workspace, risk score, session history, and detector defaults restored.'
    );
  }, [scanner, pushToast]);

  return (
    <div
      id="top"
      className={`min-h-screen bg-[#F8FAFC] text-[#0F172A] transition-colors dark:bg-[#09090D] dark:text-[#F8FAFC] ${
        activePage === 'workspace' ? 'dark:veltrix-ambient-bg' : ''
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[#7C5CFC] focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusAnnouncement}
      </div>

      <Navbar
        activePage={activePage}
        onChangePage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setPrivacyModalOpen(true)}
        onQuickUploadClick={handleQuickUploadClick}
        onResetSession={handleResetSession}
        redactionMode={scanner.redactionMode}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className={`mx-auto max-w-[1440px] px-4 pt-5 outline-none sm:px-6 lg:px-8 ${
          activePage === 'workspace' ? 'space-y-6 pb-24 lg:pb-12' : 'pb-10'
        }`}
      >
        {activePage === 'overview' ? (
          <OverviewDashboard
            hasScanned={scanner.hasScanned}
            scanResult={scanner.scanResult}
            csvResult={scanner.csvResult}
            uploadedFile={scanner.uploadedFile}
            sessionHistory={scanner.sessionHistory}
            searchQuery={searchQuery}
            onOpenWorkspace={handleOpenWorkspace}
            onLoadAndScanPreset={handleLoadAndScanPreset}
            onOpenSettings={() => setSettingsOpen(true)}
            onResetSession={handleResetSession}
          />
        ) : (
          <>
            {/* Obsidian Document Studio & Floating Sanitized Viewer */}
            <Workspace
              rawText={scanner.rawText}
              onChangeText={scanner.updateRawText}
              uploadedFile={scanner.uploadedFile}
              isCSVMode={scanner.isCSVMode}
              onFileLoaded={handleFileLoaded}
              onRemoveFile={handleRemoveFile}
              onFileError={(msg) => pushToast('error', 'File error', msg)}
              onScan={handleScan}
              onClear={handleClearAll}
              onLoadDemoText={handleLoadDemoText}
              onLoadDemoCSV={handleLoadDemoCSV}
              canUndo={scanner.canUndo}
              onUndo={handleUndo}
              liveScan={scanner.liveScan}
              onToggleLiveScan={() => {
                const next = !scanner.liveScan;
                scanner.setLiveScan(next);
                pushToast(
                  'info',
                  next ? 'Live Scan enabled' : 'Live Scan disabled',
                  next
                    ? 'Edits will automatically scan locally with debounce.'
                    : 'Click Scan & Sanitize to scan manually.'
                );
              }}
              isScanning={scanner.isScanning}
              hasScanned={scanner.hasScanned}
              scanResult={scanner.scanResult}
              leftViewMode={leftViewMode}
              onChangeLeftViewMode={setLeftViewMode}
              showHighlights={showHighlights}
              onToggleHighlights={() => setShowHighlights((prev) => !prev)}
              activeCategoryFilter={activeCategoryFilter}
              onClearCategoryFilter={() => setActiveCategoryFilter('ALL')}
              redactionMode={scanner.redactionMode}
              onChangeRedactionMode={scanner.setRedactionMode}
              customReplacements={scanner.customReplacements}
              enabledCategories={scanner.enabledCategories}
              customRules={scanner.customRules}
              onCopyOriginal={handleCopyOriginal}
              onCopySanitized={handleCopySanitized}
              onDownloadTxt={handleDownloadTxt}
              onDownloadCsv={handleDownloadCsv}
              onDownloadReport={handleDownloadReport}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenHelp={() => setPrivacyModalOpen(true)}
              onBackToOverview={() => setActivePage('overview')}
              mobileTab={mobileTab}
              onChangeMobileTab={setMobileTab}
            />

            {/* Detection Statistics Cards */}
            <StatsCards
              hasScanned={scanner.hasScanned}
              scanResult={scanner.scanResult}
              redactionMode={scanner.redactionMode}
            />

            {/* CSV Analysis Interface (when CSV is scanned) */}
            {scanner.hasScanned && scanner.csvResult && (
              <CSVAnalysis
                csvResult={scanner.csvResult}
                onToggleColumn={scanner.toggleCSVColumn}
                onSanitizeAll={() => {
                  scanner.sanitizeAllCSVColumns();
                  pushToast('info', 'All CSV columns selected', 'Sanitized CSV updated.');
                }}
                onSelectOnlyPII={() => {
                  scanner.selectOnlyPIICSVColumns();
                  pushToast('info', 'Sensitive columns selected', 'Only PII columns will be redacted.');
                }}
                onExcludeAll={() => {
                  scanner.excludeAllCSVColumns();
                  pushToast('info', 'All CSV columns excluded', 'Original CSV values preserved.');
                }}
              />
            )}

            {/* Detection Insights & Privacy-Safe Audit Log */}
            {scanner.hasScanned && scanner.scanResult && (
              <DetectionInsights
                scanResult={scanner.scanResult}
                activeCategoryFilter={activeCategoryFilter}
                onSelectCategoryFilter={(cat) => {
                  setActiveCategoryFilter(cat);
                  if (cat !== 'ALL') {
                    setLeftViewMode('highlight');
                    setShowHighlights(true);
                  }
                }}
                isCSVMode={scanner.isCSVMode}
              />
            )}

            {/* Clean Privacy Footer Strip */}
            <footer className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center dark:border-white/[0.06] dark:bg-[#131318] dark:text-[#94A3B8]">
              <div className="flex items-start gap-2.5 sm:items-center">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED] sm:mt-0 dark:text-[#A78BFA]"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    YOUR DATA STAYS ON THIS DEVICE — PROCESSING HAPPENS LOCALLY.
                  </strong>{' '}
                  Automated detection may miss edge cases—always review output before sharing.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="font-semibold text-[#7C3AED] underline-offset-4 hover:underline whitespace-nowrap shrink-0 dark:text-[#A78BFA]"
              >
                Verify Local Privacy
              </button>
            </footer>
          </>
        )}
      </main>

      {/* Mobile Sticky Bottom Action Bar (Workspace view) */}
      {activePage === 'workspace' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-md lg:hidden dark:border-white/[0.06] dark:bg-[#0D0D12]/95">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <button
              type="button"
              onClick={handleScan}
              disabled={!scanner.rawText.trim() || scanner.isScanning}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-4 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 disabled:opacity-45 whitespace-nowrap"
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              <span>{scanner.isScanning ? 'Scanning...' : 'Scan & Sanitize'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySanitized}
              disabled={!scanner.hasScanned || !scanner.scanResult?.sanitizedText}
              aria-label="Copy sanitized output"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#1C1C24] dark:text-[#F8FAFC]"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open redaction settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-white/[0.08] dark:bg-[#1C1C24] dark:text-[#F8FAFC]"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#8B5CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-Over Redaction Settings Drawer */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        redactionMode={scanner.redactionMode}
        onChangeRedactionMode={scanner.setRedactionMode}
        enabledCategories={scanner.enabledCategories}
        onToggleCategory={scanner.toggleCategoryEnabled}
        onSetAllCategories={scanner.setAllCategoriesEnabled}
        customReplacements={scanner.customReplacements}
        onUpdateCustomReplacement={scanner.updateCustomReplacement}
        customRules={scanner.customRules}
        onAddCustomRule={(rule) => {
          scanner.addCustomRule(rule);
          pushToast('success', 'Custom rule added', `"${rule.name}" is now active locally.`);
        }}
        onToggleCustomRule={scanner.toggleCustomRule}
        onRemoveCustomRule={(id) => {
          scanner.removeCustomRule(id);
          pushToast('info', 'Custom rule removed');
        }}
        onResetSettings={handleResetSettings}
        sessionHistory={scanner.sessionHistory}
        onClearHistory={() => {
          scanner.clearSessionHistory();
          pushToast('info', 'Session history cleared');
        }}
      />

      <PrivacyModal open={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CSVAnalysis } from './components/CSVAnalysis';
import { DetectionInsights } from './components/DetectionInsights';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MobileActionBar } from './components/MobileActionBar';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PrivacyModal } from './components/PrivacyModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { StatsCards } from './components/StatsCards';
import { ToastStack } from './components/Toast';
import { Workspace } from './components/Workspace';
import { PRESET_DEFINITIONS } from './engine/demoData';
import type {
  AppPage,
  CategoryFilter,
  LeftViewMode,
  MobileStudioTab,
  PresetKey,
  UploadedFileInfo,
} from './engine/types';
import { useScanner } from './hooks/useScanner';
import { useTheme } from './hooks/useTheme';
import { useToasts } from './hooks/useToasts';
import { copyToClipboard } from './utils/clipboardUtils';
import {
  downloadSanitizedCsv,
  downloadSanitizedTxt,
  downloadSummaryReport,
} from './utils/downloadUtils';
import { pluralize } from './utils/formatting';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const scanner = useScanner();
  const { toasts, statusAnnouncement, pushToast, dismissToast } = useToasts();

  const [activePage, setActivePage] = useState<AppPage>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [leftViewMode, setLeftViewMode] = useState<LeftViewMode>('edit');
  const [mobileTab, setMobileTab] = useState<MobileStudioTab>('original');
  const [showHighlights, setShowHighlights] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryFilter>('ALL');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);

  const handleScan = useCallback(() => {
    if (!scanner.rawText.trim()) {
      pushToast('error', 'Input is empty', 'Paste text or upload a file before scanning.');
      return;
    }
    const result = scanner.executeScan();
    if (!result) {
      pushToast('error', 'Scan could not complete', 'Please verify the input and try again.');
      return;
    }

    setActiveCategoryFilter('ALL');
    setLeftViewMode('highlight');
    setShowHighlights(true);
    setMobileTab('sanitized');
    const findingsCount = result.stats.totalDetections;
    const categoryCount = result.stats.uniqueCategories;
    pushToast(
      'success',
      'Local scan complete',
      findingsCount > 0
        ? `${findingsCount} sensitive ${pluralize(findingsCount, 'finding')} redacted across ${categoryCount} ${pluralize(categoryCount, 'category', 'categories')}.`
        : 'No matching PII patterns were found in this input.'
    );
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
    (preset: PresetKey) => {
      const def = PRESET_DEFINITIONS[preset];
      const fileInfo: UploadedFileInfo = {
        name: def.filename,
        size: new Blob([def.content]).size,
        type: def.fileType,
        lastModified: Date.now(),
      };

      scanner.loadFile(def.content, fileInfo);
      const result = scanner.executeScan({
        textOverride: def.content,
        csvModeOverride: def.fileType === 'csv',
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
        const count = result.stats.totalDetections;
        pushToast(
          'success',
          `${fileInfo.name} scanned locally`,
          `${count} sensitive ${pluralize(count, 'finding')} highlighted and sanitized on your device.`
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
    if (scanner.undoLastAction()) {
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
    const res = downloadSanitizedTxt(output, scanner.uploadedFile?.name);
    if (res.success) {
      pushToast('success', 'TXT downloaded', `${res.filename} exported locally.`);
    } else {
      pushToast('error', 'Export error', res.error);
    }
  }, [scanner.scanResult, scanner.uploadedFile, pushToast]);

  const handleDownloadCsv = useCallback(() => {
    const output = scanner.csvResult?.sanitizedCSV ?? '';
    if (!output) return;
    const res = downloadSanitizedCsv(output, scanner.uploadedFile?.name);
    if (res.success) {
      pushToast('success', 'CSV downloaded', `${res.filename} exported with structure intact.`);
    } else {
      pushToast('error', 'Export error', res.error);
    }
  }, [scanner.csvResult, scanner.uploadedFile, pushToast]);

  const handleDownloadReport = useCallback(() => {
    if (!scanner.scanResult) return;
    const res = downloadSummaryReport({
      sourceName:
        scanner.uploadedFile?.name ||
        (scanner.isCSVMode ? 'sample-csv-data' : 'pasted-text'),
      sourceType: scanner.uploadedFile?.type || (scanner.isCSVMode ? 'csv' : 'text'),
      redactionMode: scanner.redactionMode,
      result: scanner.scanResult,
      csvResult: scanner.csvResult,
    });
    if (res.success) {
      pushToast('success', 'Summary report downloaded', 'Metrics only — zero raw PII exposed.');
    } else {
      pushToast('error', 'Export error', res.error);
    }
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
          <ErrorBoundary sectionName="Security Overview" onReset={handleResetSession}>
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
          </ErrorBoundary>
        ) : (
          <>
            <ErrorBoundary sectionName="Document Studio" onReset={handleClearAll}>
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
            </ErrorBoundary>

            <StatsCards
              hasScanned={scanner.hasScanned}
              scanResult={scanner.scanResult}
              redactionMode={scanner.redactionMode}
            />

            {scanner.hasScanned && scanner.csvResult && (
              <ErrorBoundary sectionName="CSV Analysis">
                <CSVAnalysis
                  csvResult={scanner.csvResult}
                  onToggleColumn={scanner.toggleCSVColumn}
                  onSanitizeAll={() => {
                    scanner.sanitizeAllCSVColumns();
                    pushToast('info', 'All CSV columns selected', 'Sanitized CSV updated.');
                  }}
                  onSelectOnlyPII={() => {
                    scanner.selectOnlyPIICSVColumns();
                    pushToast(
                      'info',
                      'Sensitive columns selected',
                      'Only PII columns will be redacted.'
                    );
                  }}
                  onExcludeAll={() => {
                    scanner.excludeAllCSVColumns();
                    pushToast('info', 'All CSV columns excluded', 'Original CSV values preserved.');
                  }}
                />
              </ErrorBoundary>
            )}

            {scanner.hasScanned && scanner.scanResult && (
              <ErrorBoundary
                sectionName="Detection Insights"
                onReset={() => setActiveCategoryFilter('ALL')}
              >
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
              </ErrorBoundary>
            )}

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

      {activePage === 'workspace' && (
        <MobileActionBar
          hasInput={Boolean(scanner.rawText.trim())}
          isScanning={scanner.isScanning}
          canCopySanitized={Boolean(scanner.hasScanned && scanner.scanResult?.sanitizedText)}
          onScan={handleScan}
          onCopySanitized={handleCopySanitized}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

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

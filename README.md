# VELTRIX

**Your Data. Your Device. Your Privacy.**

VELTRIX is a privacy-first, 100% browser-based Personally Identifiable Information (PII) detection, highlighting, and sanitization tool. Users can paste raw text or upload `.txt` and `.csv` files to detect, classify, inspect, and redact sensitive fields entirely on their own device—without uploading files, calling external APIs, or storing sensitive text.

---

## Core Capabilities

- **15 PII Detection Categories**:
  - `EMAIL`, `PHONE` (Indian mobile formats), `AADHAAR` (12-digit + Verhoeff checksum confidence), `PAN`, `CARD` (Luhn checksum + card network prefix validation), `UPI` (known Indian PSP handles disambiguated from email addresses), `IP_ADDRESS` (0–255 octet validation), `URL`, `DOB` (contextual date of birth), `PERSON` (contextual labels, honorifics & CSV column heuristics), `ADDRESS` (labelled & street/apartment heuristics), `PASSPORT` (contextual), `BANK_ACCOUNT` (contextual), `PIN_CODE` (Indian 6-digit postal PIN with context), and extensible `CUSTOM` regex rules.
- **Three Live Redaction Modes**:
  - **Full Redaction**: `[EMAIL]`, `[PHONE]`, `[PAN]`, etc.
  - **Partial Masking**: e.g. `rahul@gmail.com` → `r****@gmail.com`, `9876543210` → `******3210`, `ABCDE1234F` → `AB***34*F`.
  - **Custom Replacement**: User-configurable replacement labels per category.
- **RFC-4180 CSV Parsing & Column Analysis**:
  - Handles quoted fields, commas inside quoted cells, embedded newlines inside quotes, and escaped double quotes (`""`).
  - Displays column-level PII counts, category breakdown, and allows choosing which columns to sanitize or exclude while preserving CSV structure on export.
- **Interactive Highlighting & Before/After Comparison**:
  - Safe React text-node highlighting (no `dangerouslySetInnerHTML`) with color legend, toggleable highlights, and hover/focus tooltips showing Category, Rule, Redaction output, and Confidence.
- **Local Export Suite**:
  - Copy to clipboard (with fallback), Download sanitized `.txt`, Download sanitized `.csv`, and Download PII-free summary report.

---

## Architecture

```text
src/
├── components/
│   ├── Navbar.tsx
│   ├── PrivacyBadge.tsx
│   ├── TextInputPanel.tsx
│   ├── FileUpload.tsx
│   ├── SanitizedOutput.tsx
│   ├── DetectionDashboard.tsx
│   ├── CategoryStats.tsx
│   ├── DetectionList.tsx
│   ├── HighlightedText.tsx
│   ├── CSVAnalysis.tsx
│   ├── SettingsPanel.tsx
│   ├── PrivacyModal.tsx
│   ├── Toast.tsx
│   └── Footer.tsx
├── engine/
│   ├── types.ts
│   ├── validators.ts
│   ├── patterns.ts
│   ├── redactor.ts
│   ├── detector.ts
│   ├── csvParser.ts
│   ├── csvSanitizer.ts
│   └── demoData.ts
├── hooks/
│   ├── useScanner.ts
│   └── useTheme.ts
├── utils/
│   ├── fileUtils.ts
│   ├── downloadUtils.ts
│   └── clipboardUtils.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Installation & Local Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## How to Verify Privacy (Zero Data Transmission)

VELTRIX is built to process everything locally inside your browser:

1. **Network Verification**: Open browser Developer Tools (`F12`) → **Network** tab → clear existing requests → paste text or upload a `.txt`/`.csv` file → click **Scan & Sanitize** and download the sanitized output. Zero outgoing network requests containing user content occur.
2. **Offline Verification**: After the page loads, toggle **Offline** in DevTools Network (or disconnect from the internet). Detection, highlighting, redaction, CSV column selection, and downloads continue to work identically.
3. **Storage Verification**: Open Developer Tools → **Application** → inspect **Local Storage**, **Session Storage**, and **IndexedDB**. VELTRIX stores zero user text, files, or scan history in persistent browser storage.

---

## Limitations & Disclaimer

Automated pattern and heuristic PII detection cannot guarantee 100% recall or zero false positives on arbitrary natural-language documents. Pattern recognition for identifiers such as Aadhaar, PAN, and Passport is **not** official identity verification. Always review sanitized output carefully before sharing sensitive documents externally.

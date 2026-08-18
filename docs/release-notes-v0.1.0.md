# DataFix v0.1.0

First public release of DataFix, a privacy-first browser data cleaner for messy CSV, TSV and JSON files.

## Highlights

- Local-first processing: source files stay in the browser during the normal cleaning workflow.
- UTF-8, Big5, Shift-JIS and Windows-1252 handling with confidence-aware legacy encoding detection.
- International date normalization, including ROC/Taiwan year formats and configurable DMY/MDY handling for ambiguous dates.
- US and European numeric normalization while preserving ambiguous single-separator values instead of silently rewriting them.
- Full-width character normalization, whitespace trimming and common missing-value cleanup.
- Empty and duplicate header repair.
- Original vs cleaned preview with changed-cell highlighting.
- UTF-8 CSV and JSON export.
- English and Traditional Chinese UI.

## Reliability work included before launch

- Behavioral regression tests for dates and numeric formats.
- Real Big5, Shift-JIS and Windows-1252 byte fixtures.
- Windows-1252 C1 fallback mapping for cross-runtime consistency.
- Behavioral tests for blank/duplicate headers, delimiter detection, escaped quotes and multiline CSV fields.
- GitHub Actions build, lint and test validation.
- Production dependency audit at high severity (`npm audit --omit=dev --audit-level=high`).

## Try it

Demo: https://datafix-tw.mickey921205.workers.dev

## Feedback

Real-world dirty-data edge cases are welcome. Please use small synthetic samples in public issues and never post confidential or personally identifiable source data.

## Next

Planned work includes XLSX support, editable per-column cleaning rules, duplicate-row handling, reusable cleaning profiles, and extracting the cleaning engine into a CLI/npm package.

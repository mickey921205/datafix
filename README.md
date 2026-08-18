# DataFix

**Privacy-first data cleaning for messy XLSX, CSV, TSV and JSON files — entirely in your browser.**

[**Try DataFix online →**](https://datafix-tw.mickey921205.workers.dev)

<p align="center">
  <img src="docs/datafix-mobile-showcase.svg" alt="DataFix mobile demo showing local-first XLSX, CSV, TSV and JSON cleaning with number and date normalization" width="620" />
</p>

DataFix helps clean tabular data from different regions without uploading the source file to a server. It focuses on the annoying problems that appear when data crosses systems, locales and encodings: Excel workbooks, Big5, Shift-JIS, inconsistent dates, decimal separators, full-width characters, missing values and broken column names.

> Your data stays on your device. Parsing, cleaning, previewing and exporting happen locally in the browser.

## Why DataFix?

Real-world data is rarely clean. A single dataset may contain:

- Excel `.xlsx` workbooks with one or more worksheets
- UTF-8, Big5, Shift-JIS or Windows-1252 text
- `1,234.56` and `1.234,56` numeric formats
- different date conventions such as `2026/08/18`, `18/08/2026` and `08/18/2026`
- full-width characters copied from East Asian systems
- blank, duplicated or malformed column names
- inconsistent missing-value markers and whitespace

DataFix aims to make these files usable with a quick local workflow instead of requiring a script or uploading sensitive data to an online converter.

## Features

- Import `.xlsx` locally and switch between worksheets
- Export the cleaned worksheet back to `.xlsx`
- Detect UTF-8, Big5, Shift-JIS and Windows-1252 text
- Normalize international date formats to ISO dates
- Handle US and European decimal and thousands separators
- Convert full-width characters to standard width
- Trim whitespace and unify common missing-value markers
- Repair empty and duplicate column names
- Infer text, number, date and email columns
- Compare original and cleaned data with highlighted changes
- Export UTF-8 CSV or JSON
- English, Traditional Chinese and Simplified Chinese interface

### XLSX behavior

The first XLSX implementation intentionally focuses on clean tabular values rather than lossless workbook editing. Files are parsed locally in the browser, multi-sheet workbooks can be switched in the UI, and the selected cleaned sheet can be exported to a new `.xlsx` file. Workbook styling is not preserved, and DataFix does not evaluate formulas itself; cached/displayed values are used when present.

## Privacy

DataFix is local-first. File contents are parsed, cleaned and exported in the browser. The project does not provide a file-upload API and is designed so source data does not need to leave the user's device.

When reporting bugs, **never upload real personal, confidential or credential-bearing data**. Please create a small synthetic sample that reproduces the problem.

## Quick start

Requires Node.js 22.13 or newer.

```bash
git clone https://github.com/mickey921205/datafix.git
cd datafix
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Run the project checks:

```bash
npm test
npm run lint
```

Deploy to Cloudflare Workers after authenticating Wrangler:

```bash
npm run deploy
```

## Try a safe sample

Use the synthetic dirty-data fixture at [`examples/global-messy-data.csv`](examples/global-messy-data.csv) to try date, number, whitespace, missing-value and header cleanup without sharing real data.

## Roadmap

The public roadmap is tracked in GitHub Issues. Current priorities include:

- Editable per-column cleaning rules
- Duplicate detection and merge suggestions
- Reusable cleaning profiles
- Richer Excel workbook preservation
- CLI and npm library
- More real-world fixtures from different regions

If one of these matters to you, feedback and implementation ideas are welcome in the corresponding issue.

## Contributing

Contributions are welcome — especially unusual dirty-data edge cases, reproducible bug reports, tests, documentation improvements and focused pull requests.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Community

DataFix recognizes and links to the [LINUX DO](https://linux.do/) open-source community.

## Security & responsible samples

If you believe you found a security or privacy issue, please follow [SECURITY.md](SECURITY.md). Do not publish sensitive user data in a public issue.

## License

[MIT](LICENSE)

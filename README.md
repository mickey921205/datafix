# DataFix

DataFix is a privacy-first, local browser tool for cleaning CSV, TSV and JSON files from different regions. Files never leave the user's device.

The interface is available in English and Traditional Chinese.

## Features

- Detect UTF-8, Big5, Shift-JIS and Windows-1252 text
- Normalize international date formats to ISO dates
- Handle US and European decimal and thousands separators
- Convert full-width characters to standard width
- Trim whitespace and unify common missing-value markers
- Repair empty and duplicate column names
- Infer text, number, date and email columns
- Compare original and cleaned data with highlighted changes
- Export UTF-8 CSV or JSON

## Privacy

Parsing, cleaning and exporting happen entirely in the browser. DataFix has no file-upload API and does not store or transmit file contents.

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Roadmap

- Local Excel `.xlsx` import and export
- Editable column rules
- Duplicate detection and merge suggestions
- Reusable cleaning profiles
- CLI and npm library
- More real-world fixtures from different regions

## Contributing

Bug reports, unusual dirty-data samples, feature ideas and pull requests are welcome. Never include personal data, credentials or other sensitive source data in an issue.

## License

MIT

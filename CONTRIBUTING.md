# Contributing to DataFix

Thanks for helping improve DataFix.

DataFix is most useful when it handles the messy edge cases that appear in real files from different regions and software systems. Contributions can be code, tests, documentation, bug reports or small synthetic fixtures that reproduce a data-cleaning problem.

## Before opening an issue

- Search existing issues first.
- Reduce the problem to the smallest reproducible example you can.
- Never include personal data, credentials, private business data or other sensitive source material.
- Prefer synthetic examples that preserve the formatting problem without preserving the original content.

Useful bug reports include:

- the input encoding or format, if known
- a small sample of the problematic rows
- what DataFix produced
- what you expected instead
- browser and operating system

## Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm test
npm run lint
```

## Pull requests

Please keep pull requests focused. A PR that fixes one parser edge case or adds one feature is easier to review than a large unrelated bundle.

For behavior changes, add or update a test or fixture where practical. Describe the user-visible effect in the PR body and link the relevant issue when one exists.

## Good first contributions

Good starting points include:

- additional synthetic CSV/TSV/JSON fixtures
- encoding and locale edge cases
- documentation improvements
- accessibility and keyboard-navigation fixes
- tests for existing behavior

For larger roadmap items, please comment on the issue first so implementation assumptions can be discussed before substantial work begins.

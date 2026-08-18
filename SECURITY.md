# Security Policy

DataFix is designed as a local-first browser tool, and protecting the privacy of source data is a core project goal.

## Reporting a security or privacy issue

Please do **not** open a public GitHub issue containing exploit details, credentials, personal data or confidential files.

For now, report a suspected security or privacy issue to the repository maintainer through the contact information on the maintainer's GitHub profile. Include only the minimum information needed to reproduce the issue, and use synthetic data whenever possible.

## Data samples

Never submit real customer data, credentials, API keys, medical information, financial records or other sensitive material as a fixture, issue attachment or pull-request example.

Create a minimal synthetic sample that reproduces the same encoding, parsing or formatting behavior instead.

## Scope

Issues that may be security- or privacy-relevant include:

- unexpected transmission of file contents
- persistence of source data beyond the intended local workflow
- cross-site scripting or unsafe rendering of imported content
- exposure of credentials or secrets
- dependency vulnerabilities with a practical impact on DataFix users

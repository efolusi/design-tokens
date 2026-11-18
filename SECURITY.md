# Security policy

## Supported versions

| Version | Supported |
|---|---|
| `main` | Yes. Fixes land here first |
| Tagged releases (when published) | Yes, for security fixes |

No tagged release yet. Until the first tag, only `main` is supported.

## Reporting a vulnerability

This repo holds design tokens and generated platform exports. It has no hosted backend, no telemetry, and collects no data. A malicious token edit can retheme every Meridian and Glamor consumer. A compromised release pipeline could publish poisoned exports.

Report privately via [GitHub private vulnerability reporting](https://github.com/efolusi/design-tokens/security/advisories/new) or to **security@efolusi.com**. Do not open a public issue. Include the file, a reproduction, and impact. We aim to acknowledge within 72 hours and patch within 14 days (same contact and timing as Meridian).

## Scope

- `tokens.json` and future files under `tokens/`
- Generators and CI once they exist
- Published packages once they exist

Out of scope: bugs that only live in Meridian, Glamor, or apps (report there unless the root cause is a token or export in this repo).

## Repo hygiene

- Do not commit secrets, private keys, or `.env` files.
- Treat token files as supply-chain surface for every Efolusi UI that consumes them.

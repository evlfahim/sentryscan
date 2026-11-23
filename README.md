# SentryScan

A modular secret scanner with entropy detection, staged analysis, and redaction.

## Quick Start

```bash
npm install
npm run build
```

Run CLI:

```bash
cd packages/cli && node dist/index.js scan --staged
```

Install pre-commit hook:

```bash
cd packages/cli && node dist/index.js hook install
```

## VS Code Plugin

To use as a VS Code extension:

1. Build the project: `npm run build`
2. Open VS Code and run "Install Extension from VSIX".
3. Select `packages/vscode/sentry-scan-vscode-0.1.0.vsix`.
4. The extension uses the shared core library for detection.

## Customization

Create a `.sentryrc` file to configure entropy thresholds and exclusions:

```json
{
  "entropy": 4.5,
  "exclude": ["**/*.test.ts", "node_modules/**"]
}
```

## Architecture

The core scanner lives in `packages/core` and is imported by both the CLI and VS Code extension, ensuring consistent detection logic across tools.

### Packages

- **packages/core** — Shared detection engine (pattern matching + Shannon entropy)
- **packages/cli** — Command-line interface with staged diff scanning and pre-commit hook support
- **packages/vscode** — VS Code extension for real-time secret scanning

### Detection Methods

- **Regex patterns** — Predefined patterns for AWS keys, GitHub PATs, OpenAI keys, and more
- **Shannon entropy** — Detects high-entropy strings that may be unstructured secrets

### Redaction

All findings are automatically redacted in terminal output and reports to prevent accidental secret leakage.

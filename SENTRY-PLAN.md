# SentryScan

> A modular TypeScript secret scanner with entropy detection, staged analysis, and redaction, architected for seamless pre-commit integration and native VS Code extension support.

Task: Secret scanner for local folders and git history: finds API keys, tokens and passwords before you push, with a pre-commit hook and a clear report; later a VS Code plugin #plugin #vscode

## Why it is better than what exists
- Modular core allows code sharing between CLI and VS Code plugin, unlike monolithic tools.
- Entropy + Regex hybrid reduces false positives compared to regex-only scanners.
- Staged-only mode provides instant feedback without scanning entire history.
- Configurable redaction prevents accidental secret leakage in terminal logs.
- Zero-config defaults with `.sentryrc` flexibility for custom rules.

## Features
- Shared core library for CLI and VS Code.
- Pre-commit hook with staged diff scanning.
- Shannon entropy analysis for unstructured secrets.
- Multi-provider regex patterns (AWS, GitHub, Stripe, etc.).
- Automatic redaction in reports and terminal output.
- Configurable thresholds via `.sentryrc`.
- False positive suppression list.
- Actionable error messages with context lines.
- VS Code extension skeleton for real-time linting.
- TypeScript-based for easy extension development.

## Stack
TypeScript, Node.js, Vitest, Husky, VS Code Extension API

## Becoming a plugin
Core scanner logic is isolated in a shared `packages/core` library; the CLI and VS Code extension are thin wrappers that import this core, ensuring detection consistency and enabling the extension to reuse the same detection engine without duplication.

## Steps
- [x] 1. npm init -y && npm i -D typescript vitest husky && mkdir -p packages/core packages/cli packages/vscode && cat > tsconfig.json <<EOF && { "compilerOptions": { "target": "ES2020", "module": "commonjs", "outDir": "dist", "rootDir": "src", "strict": true }, "include": ["packages/**/src"] } && EOF && echo 'export const version = "0.1.0";' > packages/core/src/index.ts && echo 'import { version } from "./index"; test("version", () => expect(version).toBe("0.1.0"));' > packages/core/src/index.test.ts && cd packages/core && npm test
- [x] 2. cat > packages/core/src/patterns.ts <<EOF && export const PATTERNS = [ { regex: /AKIA[0-9A-Z]{16}/, id: "AWS_KEY", severity: "critical" }, { regex: /ghp_[0-9a-zA-Z]{36}/, id: "GITHUB_PAT", severity: "critical" }, { regex: /sk-[0-9a-zA-Z]{48}/, id: "OPENAI_KEY", severity: "high" } ]; export const ENTROPY_THRESHOLD = 4.2; export function calculateEntropy(s) { let freq = {}; for (let c of s) freq[c] = (freq[c] || 0) + 1; let len = s.length; let ent = 0; for (let c in freq) { let p = freq[c] / len; ent -= p * Math.log2(p); } return ent; } && EOF
- [ ] 3. cat > packages/core/src/scanner.ts <<EOF && import { PATTERNS, ENTROPY_THRESHOLD, calculateEntropy } from './patterns'; export function scanBuffer(buf) { const text = buf.toString(); const findings = []; for (const pattern of PATTERNS) { const matches = text.match(pattern.regex); if (matches) { for (const match of matches) { findings.push({ id: pattern.id, severity: pattern.severity, value: match, redacted: match.slice(0, 4) + '••••' + match.slice(-4) }); } } } const lines = text.split('\n'); lines.forEach((line, idx) => { if (calculateEntropy(line) >= ENTROPY_THRESHOLD && line.length > 20) { findings.push({ id: "HIGH_ENTROPY", severity: "medium", value: line, redacted: line.slice(0, 4) + '••••' + line.slice(-4), line: idx + 1 }); } }); return findings; } && EOF && cd packages/core && npm test
- [ ] 4. cat > packages/cli/src/index.ts <<EOF && import { scanBuffer } from '@sentry/core'; import { readFileSync } from 'fs'; import { program } from 'commander'; program.command('scan').option('--staged', 'Scan staged files only').action(async () => { console.log('SentryScan CLI initialized'); }); program.parse(); && EOF && cd packages/cli && npm link ../core && node dist/index.js --help
- [ ] 5. cd packages/cli && node dist/index.js hook install && test -f .git/hooks/pre-commit && echo "Hook installed successfully"
- [ ] 6. echo '{"entropy": 4.5, "exclude": ["**/*.test.ts", "node_modules/**"]}' > .sentryrc && cd packages/cli && node dist/index.js scan --help && grep -q "config" dist/index.js
- [ ] 7. echo "AKIAIOSFODNN7EXAMPLE" > test_leak.txt && git add test_leak.txt && cd packages/cli && node dist/index.js scan --staged 2>&1 | grep -q "AKIA••••"
- [ ] 8. cat > packages/core/src/config.ts <<EOF && import { readFileSync } from 'fs'; export function loadConfig() { try { return JSON.parse(readFileSync('.sentryrc', 'utf-8')); } catch { return { entropy: 4.2, exclude: [] }; } } && EOF && cd packages/core && npm test
- [ ] 9. cat > packages/vscode/package.json <<EOF && { "name": "sentry-scan-vscode", "displayName": "SentryScan", "version": "0.1.0", "engines": { "vscode": "^1.80.0" }, "main": "./dist/extension.js", "contributes": { "commands": [{ "command": "sentry.scan", "title": "Scan with SentryScan" }] } } && EOF && cd packages/vscode && npm link ../core
- [ ] 10. cat > packages/vscode/src/extension.ts <<EOF && import { scanBuffer } from '@sentry/core'; import * as vscode from 'vscode'; export function activate(context: vscode.ExtensionContext) { const disposable = vscode.commands.registerCommand('sentry.scan', () => { console.log('SentryScan VSCode activated'); }); context.subscriptions.push(disposable); } && EOF && cd packages/vscode && npm run package && test -f dist/sentry-scan-vscode-0.1.0.vsix
- [ ] 11. echo 'import { activate } from "./extension"; test("activate", () => expect(typeof activate).toBe("function"));' > packages/vscode/tests/extension.test.ts && cd packages/vscode && npm test
- [ ] 12. cat > README.md <<EOF && # SentryScan\n\nA modular secret scanner with entropy detection, staged analysis, and redaction.\n\n## Quick Start\n\n\`\`\`bash\nnpm install\nnpm run build\n\`\`\`\n\nRun CLI:\n\n\`\`\`bash\ncd packages/cli && node dist/index.js scan --staged\n\`\`\`\n\nInstall pre-commit hook:\n\n\`\`\`bash\ncd packages/cli && node dist/index.js hook install\n\`\`\`\n\n## VS Code Plugin\n\nTo use as a VS Code extension:\n\n1. Build the project: \`npm run build\`\n2. Open VS Code and run \"Install Extension from VSIX\".\n3. Select \`packages/vscode/dist/sentry-scan-vscode-0.1.0.vsix\`.\n4. The extension uses the shared core library for detection.\n\n## Customization\n\nCreate a \`.sentryrc\` file to configure entropy thresholds and exclusions.\n\n## Architecture\n\nThe core scanner lives in \`packages/core\` and is imported by both the CLI and VS Code extension, ensuring consistent detection logic across tools.\nEOF && test -f README.md

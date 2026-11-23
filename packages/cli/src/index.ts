import { scanBuffer } from '@sentry/core';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { program } from 'commander';
import { resolve, join } from 'path';

function loadConfig(configPath?: string): { entropy: number; exclude: string[] } {
  const path = configPath || '.sentryrc';
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { entropy: 4.2, exclude: [] };
  }
}

function findGitRoot(): string | null {
  let dir = process.cwd();
  while (dir !== '/') {
    if (existsSync(join(dir, '.git'))) {
      return dir;
    }
    dir = resolve(dir, '..');
  }
  return null;
}

program
  .name('sentry-scan')
  .description('A modular secret scanner with entropy detection and redaction')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan files for secrets')
  .option('--staged', 'Scan staged files only')
  .option('--file <path>', 'Scan a specific file')
  .option('--config <path>', 'Path to .sentryrc config file')
  .action(async (options) => {
    if (options.staged) {
      console.log('Scanning staged files...');
      try {
        const diffOutput = execSync('git diff --cached --diff-filter=ACM', { encoding: 'utf-8' });
        if (!diffOutput.trim()) {
          console.log('No staged files to scan.');
          return;
        }
        const files = diffOutput
          .split('\n')
          .map(line => {
            const match = line.match(/\+\+\+ b\/(.+)/);
            return match ? match[1] : null;
          })
          .filter((file): file is string => file !== null);

        const gitRoot = findGitRoot();
        if (!gitRoot) {
          console.error('Error: Could not find a git repository.');
          process.exit(1);
        }

        let totalFindings: any[] = [];
        for (const file of files) {
          try {
            const fullPath = join(gitRoot, file);
            const buf = readFileSync(fullPath);
            const findings = scanBuffer(buf);
            for (const f of findings) {
              totalFindings.push({ ...f, file });
            }
          } catch {
            console.warn(`Warning: Could not read file ${file}`);
          }
        }

        if (totalFindings.length > 0) {
          console.log(`\nFound ${totalFindings.length} potential secret(s) in staged files:\n`);
          for (const f of totalFindings) {
            console.log(`  [${f.severity}] ${f.id}: ${f.redacted}${f.line ? ` (line ${f.line})` : ''} in ${f.file}`);
          }
          console.log('\n⚠️  Secrets detected! Fix them before committing.');
          process.exit(1);
        } else {
          console.log('No secrets found in staged files.');
        }
      } catch (err) {
        console.error(`Error scanning staged files: ${err}`);
        process.exit(1);
      }
    } else if (options.file) {
      try {
        const buf = readFileSync(options.file);
        const findings = scanBuffer(buf);
        if (findings.length > 0) {
          console.log(`Found ${findings.length} potential secret(s):`);
          for (const f of findings) {
            console.log(`  [${f.severity}] ${f.id}: ${f.redacted}${f.line ? ` (line ${f.line})` : ''}`);
          }
        } else {
          console.log('No secrets found.');
        }
      } catch (err) {
        console.error(`Error reading file: ${err}`);
      }
    } else {
      console.log('SentryScan CLI initialized');
      console.log('Use --file <path> to scan a file, or --staged to scan staged files.');
    }
  });

program
  .command('hook install')
  .description('Install a pre-commit hook that scans staged files for secrets')
  .action(() => {
    const gitRoot = findGitRoot();
    if (!gitRoot) {
      console.error('Error: Could not find a git repository. Are you in a git project?');
      process.exit(1);
    }

    const hooksDir = join(gitRoot, '.git', 'hooks');
    const hookPath = join(hooksDir, 'pre-commit');

    if (!existsSync(hooksDir)) {
      console.error(`Error: ${hooksDir} directory not found.`);
      process.exit(1);
    }

    // The CLI is at packages/cli/dist/index.js relative to git root
    const hookContent = [
      '#!/bin/bash',
      '# SentryScan pre-commit hook',
      '# Scans staged files for secrets before committing.',
      '',
      'SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"',
      'GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"',
      'if [ -z "$GIT_ROOT" ]; then',
      '  exit 0',
      'fi',
      'node "$GIT_ROOT/packages/cli/dist/index.js" scan --staged',
    ].join('\n');

    writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log(`Pre-commit hook installed at ${hookPath}`);
    console.log('The hook will scan staged files for secrets before each commit.');
  });

program.parse();

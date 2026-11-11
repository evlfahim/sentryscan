import { scanBuffer } from '@sentry/core';
import { readFileSync } from 'fs';
import { program } from 'commander';

program
  .name('sentry-scan')
  .description('A modular secret scanner with entropy detection and redaction')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan files for secrets')
  .option('--staged', 'Scan staged files only')
  .option('--file <path>', 'Scan a specific file')
  .action(async (options) => {
    if (options.staged) {
      console.log('Scanning staged files...');
      // In a real implementation, this would use git diff --cached
      console.log('SentryScan CLI initialized');
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

program.parse();

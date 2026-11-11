import { PATTERNS, ENTROPY_THRESHOLD, calculateEntropy } from './patterns';

export interface Finding {
  id: string;
  severity: string;
  value: string;
  redacted: string;
  line?: number;
}

export function scanBuffer(buf: Buffer): Finding[] {
  const text = buf.toString();
  const findings: Finding[] = [];

  for (const pattern of PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        findings.push({
          id: pattern.id,
          severity: pattern.severity,
          value: match,
          redacted: match.slice(0, 4) + '••••' + match.slice(-4),
        });
      }
    }
  }

  const lines = text.split('\n');
  lines.forEach((line: string, idx: number) => {
    if (calculateEntropy(line) >= ENTROPY_THRESHOLD && line.length > 20) {
      findings.push({
        id: 'HIGH_ENTROPY',
        severity: 'medium',
        value: line,
        redacted: line.slice(0, 4) + '••••' + line.slice(-4),
        line: idx + 1,
      });
    }
  });

  return findings;
}

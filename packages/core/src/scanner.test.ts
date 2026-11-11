import { describe, it, expect } from 'vitest';
import { scanBuffer } from './scanner';

describe('scanBuffer', () => {
  it('detects AWS keys', () => {
    const buf = Buffer.from('my key is AKIAIOSFODNN7EXAMPLE here');
    const findings = scanBuffer(buf);
    const awsFindings = findings.filter((f) => f.id === 'AWS_KEY');
    expect(awsFindings.length).toBeGreaterThan(0);
    expect(awsFindings[0].redacted).toContain('••••');
  });

  it('detects GitHub PATs', () => {
    const buf = Buffer.from('token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij');
    const findings = scanBuffer(buf);
    const ghFindings = findings.filter((f) => f.id === 'GITHUB_PAT');
    expect(ghFindings.length).toBeGreaterThan(0);
  });

  it('detects OpenAI keys', () => {
    const buf = Buffer.from('key=sk-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345');
    const findings = scanBuffer(buf);
    const openaiFindings = findings.filter((f) => f.id === 'OPENAI_KEY');
    expect(openaiFindings.length).toBeGreaterThan(0);
  });

  it('detects high entropy lines', () => {
    const buf = Buffer.from('normal line\naGVsbG8gd29ybGQgdGhpcyBpcyBhIHZlcnkgbG9uZyBsaW5lIHRoYXQgaGFzIGhpZ2ggZW50cm9weQ==\n');
    const findings = scanBuffer(buf);
    const entropyFindings = findings.filter((f) => f.id === 'HIGH_ENTROPY');
    expect(entropyFindings.length).toBeGreaterThan(0);
    expect(entropyFindings[0].line).toBe(2);
  });

  it('returns empty array for safe content', () => {
    const buf = Buffer.from('hello world\nthis is safe\n');
    const findings = scanBuffer(buf);
    expect(findings.length).toBe(0);
  });

  it('redacts found values', () => {
    const buf = Buffer.from('AKIAIOSFODNN7EXAMPLE');
    const findings = scanBuffer(buf);
    const awsFindings = findings.filter((f) => f.id === 'AWS_KEY');
    expect(awsFindings[0].redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(awsFindings[0].redacted).toContain('••••');
  });
});

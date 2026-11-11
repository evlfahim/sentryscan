export const PATTERNS = [
  { regex: /AKIA[0-9A-Z]{16}/, id: "AWS_KEY", severity: "critical" },
  { regex: /ghp_[0-9a-zA-Z]{36}/, id: "GITHUB_PAT", severity: "critical" },
  { regex: /sk-[0-9a-zA-Z]{48}/, id: "OPENAI_KEY", severity: "high" },
];

export const ENTROPY_THRESHOLD = 4.2;

export function calculateEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const c of s) {
    freq[c] = (freq[c] || 0) + 1;
  }
  let ent = 0;
  for (const c in freq) {
    const p = freq[c] / s.length;
    ent -= p * Math.log2(p);
  }
  return ent;
}

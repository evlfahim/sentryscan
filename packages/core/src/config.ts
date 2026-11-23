import { readFileSync } from 'fs';

export interface SentryConfig {
  entropy: number;
  exclude: string[];
}

export function loadConfig(): SentryConfig {
  try {
    return JSON.parse(readFileSync('.sentryrc', 'utf-8')) as SentryConfig;
  } catch {
    return { entropy: 4.2, exclude: [] };
  }
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

describe('loadConfig', () => {
  const configPath = '.sentryrc';

  beforeEach(() => {
    // Clean up any existing .sentryrc
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  afterEach(() => {
    // Clean up
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  it('returns default config when .sentryrc does not exist', () => {
    const config = loadConfig();
    expect(config).toEqual({ entropy: 4.2, exclude: [] });
  });

  it('returns parsed config from .sentryrc when it exists', () => {
    writeFileSync(configPath, JSON.stringify({ entropy: 5.0, exclude: ['**/*.test.ts'] }));
    const config = loadConfig();
    expect(config).toEqual({ entropy: 5.0, exclude: ['**/*.test.ts'] });
  });

  it('returns default config when .sentryrc contains invalid JSON', () => {
    writeFileSync(configPath, 'not valid json {{{');
    const config = loadConfig();
    expect(config).toEqual({ entropy: 4.2, exclude: [] });
  });
});

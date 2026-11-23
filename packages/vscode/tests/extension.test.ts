import { activate } from '../src/extension';
import { describe, it, expect, vi } from 'vitest';

describe('extension', () => {
  it('activate is a function', () => {
    expect(typeof activate).toBe('function');
  });
});

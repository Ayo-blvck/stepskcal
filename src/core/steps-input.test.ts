import { describe, expect, it } from 'vitest';
import { parseSteps, stepProgress } from './index';

describe('parseSteps', () => {
  it('accepts plain numbers, commas and spaces', () => {
    expect(parseSteps('8432')).toEqual({ kind: 'ok', steps: 8432 });
    expect(parseSteps('8,432')).toEqual({ kind: 'ok', steps: 8432 });
    expect(parseSteps(' 8 432 ')).toEqual({ kind: 'ok', steps: 8432 });
    expect(parseSteps('0')).toEqual({ kind: 'ok', steps: 0 });
  });
  it('treats blank as empty', () => {
    expect(parseSteps('   ')).toEqual({ kind: 'empty' });
  });
  it('rejects bad input', () => {
    expect(parseSteps('8.5k').kind).toBe('error');
    expect(parseSteps('-5').kind).toBe('error');
    expect(parseSteps('150000').kind).toBe('error');
  });
});

describe('stepProgress', () => {
  it('computes progress and what is left', () => {
    expect(stepProgress(6000, 8000)).toEqual({ fraction: 0.75, remaining: 2000, reached: false });
  });
  it('caps at 100% once the target is reached', () => {
    expect(stepProgress(9000, 8000)).toEqual({ fraction: 1, remaining: 0, reached: true });
  });
});
import { describe, expect, it } from 'vitest';
import { formatUpdated, yearOf } from './format';

describe('formatUpdated', () => {
  it('formats an ISO date as "Month YYYY" in English, whatever the visitor locale', () => {
    expect(formatUpdated('2026-10-16')).toBe('October 2026');
    expect(formatUpdated('2027-01-01')).toBe('January 2027');
  });

  it('does not shift the month across time zones (first and last day of a month)', () => {
    expect(formatUpdated('2026-03-01')).toBe('March 2026');
    expect(formatUpdated('2026-03-31')).toBe('March 2026');
  });

  it('returns null for a malformed date instead of printing "Invalid Date"', () => {
    expect(formatUpdated('')).toBeNull();
    expect(formatUpdated('2026-13-01')).toBeNull();
    expect(formatUpdated('October 2026')).toBeNull();
  });
});

describe('yearOf', () => {
  it('reads the year from an ISO date', () => {
    expect(yearOf('2026-10-16')).toBe('2026');
  });

  it('returns null for a malformed date', () => {
    expect(yearOf('soon')).toBeNull();
  });
});

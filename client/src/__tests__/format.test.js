import { describe, it, expect } from 'vitest';
import { cx, formatINR, formatPct, formatSigned, initialsOf, toISODate, txId } from '../lib/format';

describe('formatINR', () => {
  it('formats with Indian digit grouping (lakhs)', () => {
    expect(formatINR(1234567)).toBe('₹12,34,567');
  });
  it('formats zero and small numbers', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(842)).toBe('₹842');
  });
  it('supports compact notation for axes', () => {
    expect(formatINR(1234567, { compact: true })).toMatch(/₹12\.3?L|^₹1.2Cr/);
  });
  it('handles garbage input safely', () => {
    expect(formatINR('not a number')).toBe('₹0');
  });
});

describe('formatSigned', () => {
  it('prefixes expense with minus and income with plus', () => {
    expect(formatSigned(500, 'expense')).toBe('−₹500');
    expect(formatSigned(500, 'income')).toBe('+₹500');
  });
});

describe('formatPct', () => {
  it('formats with optional sign and digits', () => {
    expect(formatPct(12.345)).toBe('12.3%');
    expect(formatPct(12.345, { signed: true })).toBe('+12.3%');
    expect(formatPct(-8, { digits: 0 })).toBe('-8%');
  });
});

describe('toISODate', () => {
  it('produces yyyy-mm-dd in local time', () => {
    expect(toISODate(new Date(2026, 10, 15))).toBe('2026-11-15');
    expect(toISODate(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

describe('initialsOf', () => {
  it('takes first letters of first two words', () => {
    expect(initialsOf('Aarav Sharma')).toBe('AS');
    expect(initialsOf('priya')).toBe('P');
    expect(initialsOf('')).toBe('EF');
  });
});

describe('cx / txId', () => {
  it('joins truthy classnames', () => {
    expect(cx('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });
  it('prefers id, falls back to _id', () => {
    expect(txId({ id: 'x' })).toBe('x');
    expect(txId({ _id: 'y' })).toBe('y');
  });
});

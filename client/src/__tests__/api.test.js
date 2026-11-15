import { describe, it, expect } from 'vitest';
import { toQueryString } from '../lib/api';

describe('toQueryString', () => {
  it('serialises params, skipping empty values', () => {
    expect(toQueryString({ a: 1, b: 'x', c: '', d: null, e: undefined, f: 0 })).toBe('?a=1&b=x&f=0');
  });
  it('encodes special characters', () => {
    expect(toQueryString({ q: 'Rent & Housing' })).toBe('?q=Rent+%26+Housing');
  });
  it('returns empty string when nothing is set', () => {
    expect(toQueryString({})).toBe('');
    expect(toQueryString()).toBe('');
  });
});

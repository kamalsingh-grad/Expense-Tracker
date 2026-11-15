import { describe, it, expect } from 'vitest';
import { buildCSV, csvEscape, transactionsToCSV } from '../lib/csv';

describe('csvEscape', () => {
  it('quotes fields containing commas, quotes or newlines', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('line\nbreak')).toBe('"line\nbreak"');
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(42)).toBe('42');
  });
});

describe('buildCSV', () => {
  it('renders header + rows with CRLF line endings', () => {
    const csv = buildCSV(['Date', 'Amount'], [['2026-11-15', 100], ['2026-11-14', 250]]);
    expect(csv.split('\r\n')).toHaveLength(3);
    expect(csv.startsWith('Date,Amount')).toBe(true);
  });
});

describe('transactionsToCSV', () => {
  it('emits the expected columns and escapes notes with commas', () => {
    const csv = transactionsToCSV([
      { date: '2026-11-15T10:00:00.000Z', type: 'expense', amount: 499, category: 'Food & Dining', description: 'Biryani, family pack', merchant: 'Behrouz', paymentMethod: 'UPI', tags: ['food', 'family'], notes: 'tasty, value' },
    ]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('Date,Type,Amount (INR),Category,Description,Merchant,Payment Method,Tags,Notes');
    expect(row).toContain('"Biryani, family pack"');
    expect(row).toContain('food; family');
    expect(row).toContain('"tasty, value"');
  });
});

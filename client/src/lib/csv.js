/** RFC-4180-ish CSV helpers */

export const csvEscape = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const buildCSV = (headers, rows) => {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  return lines.join('\r\n');
};

export const downloadCSV = (filename, csv) => {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const transactionsToCSV = (rows) =>
  buildCSV(
    ['Date', 'Type', 'Amount (INR)', 'Category', 'Description', 'Merchant', 'Payment Method', 'Tags', 'Notes'],
    rows.map((t) => [
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.amount,
      t.category,
      t.description,
      t.merchant ?? '',
      t.paymentMethod ?? '',
      Array.isArray(t.tags) ? t.tags.join('; ') : '',
      t.notes ?? '',
    ])
  );

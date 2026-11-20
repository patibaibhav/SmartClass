/** Download rows as a CSV file (Excel-safe: quoting, UTF-8 BOM, formula-injection guard). */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    let text = value == null ? '' : String(value);
    if (/^[=+\-@]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = '﻿' + rows.map(row => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

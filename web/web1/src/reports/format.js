/* Small helpers shared by the report screens. */

export const COMPANY_NAME = 'Punjab Hospital';

/** "Rs 1,000" / "Rs 1,250.5" - whole rupees without decimals, like the Xmart view-style screens */
export const rs = v =>
  `Rs ${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const pad = n => String(n).padStart(2, '0');

/** local (not UTC) YYYY-MM-DD, so Pakistan mornings do not slip to "yesterday" */
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "2026-09-19" -> "19/09/2026" */
export const fmtDate = v => {
  if (!v) return '';
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(v);
};

/** ISO timestamp from the API -> "19/09/2026 08:14 PM" in local time */
export const fmtDateTime = v => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const h = d.getHours() % 12 || 12;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(h)}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};

export const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** WhatsApp link. Pakistani local numbers (03xx...) become 92 3xx... ; no number = WhatsApp asks who to send to. */
export function whatsappLink(phone, text) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `92${d.slice(1)}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

/** Excel-friendly CSV download (UTF-8 BOM so Excel reads symbols and Urdu correctly) */
export function exportCsv(filename, columns, rows) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [columns.map(c => q(c.title)).join(',')];
  rows.forEach(r => lines.push(columns.map(c => q(c.csv ? c.csv(r[c.dataIndex], r) : r[c.dataIndex])).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}


/** Excel-compatible .xls export. Uses SpreadsheetML/HTML so it works without a third-party package. */
export function exportExcel(filename, columns, rows, footer = null, title = '') {
  const escXml = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const value = (c, r) => c.csv ? c.csv(r[c.dataIndex], r) : r[c.dataIndex];
  const head = columns.map(c => `<th>${escXml(c.title)}</th>`).join('');
  const body = rows.map(r => `<tr>${columns.map(c => `<td>${escXml(value(c,r))}</td>`).join('')}</tr>`).join('');
  const foot = footer ? `<tr>${columns.map(c => `<td><b>${escXml(footer[c.dataIndex] ?? '')}</b></td>`).join('')}</tr>` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial}th,td{border:1px solid #ccc;padding:6px}th{background:#eef2f7;font-weight:bold}.title{font-size:16px;font-weight:bold}</style></head><body>${title ? `<h2>${escXml(title)}</h2>` : ''}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Opens a print-ready A4 document; browser can save it as PDF. */
export function exportPdf(html) {
  printHtml(html);
}

/** prints an HTML string through a hidden iframe (no pop-up blocker problems) */
export function printHtml(html) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try { frame.contentWindow.focus(); frame.contentWindow.print(); } finally { setTimeout(() => frame.remove(), 60000); }
  }, 250);
}

/** A4 table printout: company, report title, dates, optional summary line, table, optional totals row */
export function reportHtml({ title, subtitle, summary, columns, rows, footer }) {
  const cell = (c, r) => {
    const v = c.print ? c.print(r[c.dataIndex], r) : c.csv ? c.csv(r[c.dataIndex], r) : r[c.dataIndex];
    return esc(v ?? '');
  };
  const right = c => (c.align === 'right' ? ' class="r"' : '');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;font-size:10.5px;color:#111}h1,h2{text-align:center;margin:3px}
.m{text-align:center;color:#444;margin-bottom:10px}.s{margin:8px 0;font-size:11.5px}table{width:100%;border-collapse:collapse}
th,td{border:1px solid #bbb;padding:4px 6px;text-align:left}th{background:#f3f4f6}.r{text-align:right}tfoot td{font-weight:700;background:#fafafa}
</style></head><body><h1>${esc(COMPANY_NAME)}</h1><h2>${esc(title)}</h2><div class="m">${esc(subtitle || '')}</div>
${summary ? `<div class="s">${summary}</div>` : ''}
<table><thead><tr>${columns.map(c => `<th${right(c)}>${esc(c.title)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${columns.map(c => `<td${right(c)}>${cell(c, r)}</td>`).join('')}</tr>`).join('')}</tbody>
${footer ? `<tfoot><tr>${columns.map((c, i) => `<td${right(c)}>${esc(footer[c.dataIndex] ?? (i === 0 ? 'Total' : ''))}</td>`).join('')}</tr></tfoot>` : ''}</table>
<p style="text-align:center;color:#666;font-size:9px;margin-top:14px">Generated ${esc(new Date().toLocaleString())}</p></body></html>`;
}

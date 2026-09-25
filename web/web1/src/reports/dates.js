import { ymd } from './format.js';

export const PRESETS = [
  ['today', 'Today'],
  ['week', 'This Week'],
  ['month', 'This Month'],
  ['lastmonth', 'Last Month'],
  ['quarter', 'This Quarter'],
  ['year', 'This Year'],
  ['custom', 'Custom']
];

/** [from, to] (YYYY-MM-DD) for a preset. Week starts on Monday. */
export function presetRange(key, now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth();
  switch (key) {
    case 'today': return [ymd(now), ymd(now)];
    case 'week': {
      const s = new Date(now);
      s.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      return [ymd(s), ymd(e)];
    }
    case 'lastmonth': return [ymd(new Date(y, m - 1, 1)), ymd(new Date(y, m, 0))];
    case 'quarter': { const q = Math.floor(m / 3) * 3; return [ymd(new Date(y, q, 1)), ymd(new Date(y, q + 3, 0))]; }
    case 'year': return [ymd(new Date(y, 0, 1)), ymd(new Date(y, 11, 31))];
    case 'month':
    default: return [ymd(new Date(y, m, 1)), ymd(new Date(y, m + 1, 0))];
  }
}

const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/**
 * The period to compare against, plus the wording for the badge ("vs last month").
 * Calendar presets compare with the previous calendar period, everything else with the same number of days just before.
 */
export function previousPeriod(preset, from, to) {
  const f = parse(from), t = parse(to);
  const y = f.getFullYear(), m = f.getMonth();
  switch (preset) {
    case 'today': return { from: ymd(addDays(f, -1)), to: ymd(addDays(f, -1)), label: 'vs yesterday' };
    case 'week': return { from: ymd(addDays(f, -7)), to: ymd(addDays(t, -7)), label: 'vs last week' };
    case 'month': return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)), label: 'vs last month' };
    case 'quarter': return { from: ymd(new Date(y, m - 3, 1)), to: ymd(new Date(y, m, 0)), label: 'vs last quarter' };
    case 'year': return { from: ymd(new Date(y - 1, 0, 1)), to: ymd(new Date(y - 1, 11, 31)), label: 'vs last year' };
    default: {
      const days = Math.round((t - f) / 86400000) + 1;
      return { from: ymd(addDays(f, -days)), to: ymd(addDays(f, -1)), label: 'vs previous period' };
    }
  }
}

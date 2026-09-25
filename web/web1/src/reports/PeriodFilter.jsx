import React from 'react';
import { Select } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { PRESETS, presetRange } from './dates.js';

/**
 * "Filter by :  [This Month v] [ 01/09/2026 To 30/09/2026 ] [All Firms v]"
 * value = { preset, from, to }
 * The firm pill is shown because the Xmart view screen has it; this system runs one firm, so it is fixed to "All Firms".
 */
export default function PeriodFilter({ value, onChange, showFirm = true }) {
  const setPreset = key => {
    if (key === 'custom') return onChange({ ...value, preset: 'custom' });
    const [from, to] = presetRange(key);
    return onChange({ preset: key, from, to });
  };

  const setDate = (field, v) => {
    if (!v) return;
    const next = { ...value, [field]: v, preset: 'custom' };
    if (next.from > next.to) { if (field === 'from') next.to = v; else next.from = v; }
    onChange(next);
  };

  return (
    <div className="rp-filter">
      <span className="rp-filter-label">Filter by :</span>

      <div className="rp-pill rp-pill-select">
        <Select
          value={value.preset}
          onChange={setPreset}
          variant="borderless"
          popupMatchSelectWidth={false}
          options={PRESETS.map(([v, label]) => ({ value: v, label }))}
          aria-label="Period"
        />
      </div>

      <label className="rp-pill rp-pill-dates">
        <CalendarOutlined />
        <input type="date" value={value.from} max={value.to} onChange={e => setDate('from', e.target.value)} aria-label="From date" />
        <span>To</span>
        <input type="date" value={value.to} min={value.from} onChange={e => setDate('to', e.target.value)} aria-label="To date" />
      </label>

      {showFirm && (
        <div className="rp-pill rp-pill-select">
          <Select value="all" variant="borderless" disabled options={[{ value: 'all', label: 'All Firms' }]} aria-label="Firm" />
        </div>
      )}
    </div>
  );
}

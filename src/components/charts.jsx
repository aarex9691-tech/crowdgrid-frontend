import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Table2 } from 'lucide-react';

/**
 * Chart building blocks for the dashboards.
 *
 * Colours follow the data-viz palette: categorical slots in fixed order
 * (blue, orange, aqua; validated for colour-blind separation), one blue ramp for
 * magnitude, text always in ink colours. Every chart has a legend for 2+ series
 * and a "Table" view with the exact numbers.
 */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a'];
export const BLUE_RAMP = ['#f1f6fd', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#2a78d6', '#1c5cab', '#104281'];
const INK = '#1b2a4a';
const MUTED = '#4a5878';
const GRID = '#e6ebf2';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const shortDay = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};
export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
export const num = (n) => Math.round(n || 0).toLocaleString('en-IN');

/** Card with a title, a one-line takeaway and a Chart / Table switch. */
export function ChartCard({ title, subtitle, table, children, className = '', action }) {
  const [view, setView] = useState('chart');
  return (
    <section className={`panel flex flex-col p-4 sm:p-5 ${className}`} aria-label={title}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
        </div>
        <div className="flex flex-none items-center gap-1">
          {action}
          {table && (
            <div className="flex rounded-lg bg-mist p-0.5" role="group" aria-label={`${title}: view as`}>
              {[['chart', BarChart3, 'Chart'], ['table', Table2, 'Table']].map(([k, Icon, label]) => (
                <button key={k} type="button" aria-pressed={view === k} title={label} className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-bold ${view === k ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`} onClick={() => setView(k)}>
                  <Icon size={14} aria-hidden /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {view === 'chart' || !table ? children : <DataTable {...table} />}
    </section>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-mist">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={`px-3 py-2 font-semibold ${c.num ? 'text-right' : 'text-left'}`}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {columns.map((c) => <td key={c.key} className={`px-3 py-1.5 ${c.num ? 'text-right tabular-nums' : ''}`}>{c.format ? c.format(r[c.key]) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend({ series }) {
  if (series.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
      {series.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: s.color || SERIES[i] }} aria-hidden /> {s.label}
        </li>
      ))}
    </ul>
  );
}

function TooltipBox({ active, payload, label, series, format = num, labelFormat = shortDay }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-bold text-ink">{labelFormat(label)}</p>
      {[...payload].reverse().map((p) => {
        const s = series.find((x) => x.key === p.dataKey);
        return (
          <p key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-soft"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />{s?.label || p.dataKey}</span>
            <span className="font-semibold tabular-nums text-ink">{format(p.value)}</span>
          </p>
        );
      })}
      {payload.length > 1 && <p className="mt-1 flex justify-between gap-4 border-t border-line pt-1"><span className="text-ink-soft">Total</span><span className="font-bold tabular-nums">{format(total)}</span></p>}
    </div>
  );
}

const axisProps = { tick: { fill: MUTED, fontSize: 12 }, tickLine: false, axisLine: { stroke: GRID } };

/** Stacked (or single) bars per day. series: [{ key, label }] in fixed colour order. */
export function DailyBars({ data, series, height = 240, format = num, yWidth = 44 }) {
  const last = series.length - 1;
  return (
    <>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={shortDay} {...axisProps} minTickGap={12} />
            <YAxis {...axisProps} axisLine={false} width={yWidth} tickFormatter={format} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(27,42,74,0.06)' }} content={<TooltipBox series={series} format={format} />} />
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color || SERIES[i]} stroke="#ffffff" strokeWidth={1} radius={i === last ? [4, 4, 0, 0] : 0} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend series={series} />
    </>
  );
}

/** One measure over days as a 2px line with a soft dot on hover. */
export function DailyLine({ data, dataKey, label, height = 240, format = num, color = SERIES[0] }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={shortDay} {...axisProps} minTickGap={12} />
          <YAxis {...axisProps} axisLine={false} width={44} tickFormatter={format} allowDecimals={false} />
          <Tooltip cursor={{ stroke: INK, strokeOpacity: 0.25 }} content={<TooltipBox series={[{ key: dataKey, label }]} format={format} />} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars of a percentage (e.g. occupancy), value printed at the end of each bar. */
export function PercentBars({ rows, labelKey = 'name', valueKey = 'occupancyPct', detail }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r[labelKey]}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">{r[labelKey]}</span>
            <span className="flex-none tabular-nums text-ink-soft">{detail ? detail(r) : ''} <b className="text-ink">{r[valueKey]}%</b></span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist" role="img" aria-label={`${r[labelKey]}: ${r[valueKey]}%`}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(r[valueKey], r[valueKey] ? 2 : 0)}%`, background: SERIES[0] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 7 x 24 heat map (day of week x hour) on the single blue ramp. */
export function HourHeatmap({ heatmap }) {
  const max = Math.max(1, ...heatmap.grid.flat());
  const step = (v) => (v === 0 ? 0 : Math.min(BLUE_RAMP.length - 1, 1 + Math.floor((v / max) * (BLUE_RAMP.length - 2))));
  const [hover, setHover] = useState(null);
  const fmtHour = (h) => `${String(h).padStart(2, '0')}:00`;
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] gap-[2px]" style={{ gridTemplateColumns: '2.5rem repeat(24, minmax(0, 1fr))' }} onMouseLeave={() => setHover(null)}>
          <span />
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-[10px] text-ink-soft">{h % 3 === 0 ? h : ''}</span>)}
          {heatmap.days.map((d, di) => [
            <span key={d} className="pr-1 text-right text-xs leading-5 text-ink-soft">{d}</span>,
            ...heatmap.grid[di].map((v, h) => (
              <span
                key={`${d}-${h}`}
                className={`h-5 rounded-[3px] ${hover && hover.d === di && hover.h === h ? 'ring-2 ring-ink' : ''}`}
                style={{ background: BLUE_RAMP[step(v)] }}
                onMouseEnter={() => setHover({ d: di, h, v })}
                title={`${d} ${fmtHour(h)}–${fmtHour((h + 1) % 24)}: ${v} scans`}
                aria-label={`${d} ${fmtHour(h)}: ${v} scans`}
              />
            )),
          ])}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft">
        <span className="min-h-4" aria-live="polite">{hover ? <><b className="text-ink">{heatmap.days[hover.d]} {fmtHour(hover.h)}</b>: {hover.v} passes scanned</> : 'Hover a square for exact numbers'}</span>
        <span className="flex items-center gap-1">Fewer {BLUE_RAMP.slice(1).map((c) => <span key={c} className="h-3 w-3 rounded-sm" style={{ background: c }} />)} More</span>
      </div>
    </div>
  );
}

/** Big number tile. */
export function Kpi({ label, value, hint, tone }) {
  return (
    <div className="panel p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`mt-0.5 text-2xl font-extrabold tabular-nums sm:text-3xl ${tone || 'text-ink'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

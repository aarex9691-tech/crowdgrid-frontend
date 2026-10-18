import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Info } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { LiveBadge, useLive } from '../../lib/realtime';
import Notice, { Loading } from '../../components/Notice';
import { ChartCard, DailyBars, DailyLine, HourHeatmap, inr, Kpi, num, PercentBars, shortDay } from '../../components/charts';

const RANGES = [7, 14, 30];
const SOS_TYPE = { MEDICAL: 'Medical', LOST: 'Lost person', CROWD: 'Crowd', FIRE: 'Fire', GENERAL: 'General' };

/** Downloads a CSV report (the API needs the login token, so a plain link would not work). */
async function downloadCsv(params, report) {
  const res = await API.get('/analytics/export', { params: { ...params, report }, responseType: 'blob' });
  const name = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '')?.[1] || `crowdgrid-${report}.csv`;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** District analytics: how the mela is going over the last 7, 14 or 30 days, updating live. */
export default function Analytics() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyCsv, setBusyCsv] = useState('');

  useEffect(() => {
    API.get('/events', { params: { kind: 'YATRA' } }).then(({ data: list }) => {
      setEvents(list);
      setEventId((list.find((e) => e.isFlagship) || list[0])?._id || '');
    });
  }, []);

  const load = useCallback(() => {
    if (!eventId) return;
    API.get('/analytics/overview', { params: { eventId, days } })
      .then(({ data: d }) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(errorMessage(e)));
  }, [eventId, days]);
  useEffect(() => {
    load();
  }, [load]);
  // Every booking, meal, scan, payment or SOS refreshes the figures (at most every 2 s)
  useLive(['beds', 'meals', 'scan', 'sales', 'tickets', 'passes', 'sos'], load, { wait: 2000 });

  const csv = async (report) => {
    setBusyCsv(report);
    try {
      await downloadCsv({ eventId, days }, report);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyCsv('');
    }
  };

  const k = data?.kpis;
  const csvButton = (report, label) => (
    <button type="button" className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-ink-soft hover:bg-mist hover:text-ink" onClick={() => csv(report)} disabled={!!busyCsv} title={`Download ${label} as CSV`}>
      <Download size={14} aria-hidden /> {busyCsv === report ? '…' : 'CSV'}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold">Analytics <LiveBadge /></h1>
          <p className="text-ink-soft">{data ? `${data.event.title} · ${shortDay(data.days[0])} to ${shortDay(data.days[data.days.length - 1])}` : 'Loading…'}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {events.length > 1 && (
            <div>
              <label htmlFor="an-ev" className="field-label">Yatra</label>
              <select id="an-ev" className="field min-h-10" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
              </select>
            </div>
          )}
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-line" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} className={`min-h-9 rounded-lg px-3 text-sm font-bold ${days === r ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`} onClick={() => setDays(r)}>
                {r} days
              </button>
            ))}
          </div>
          <Link to="/control" className="btn-ghost min-h-10">Control room</Link>
        </div>
      </div>

      <Notice tone="error">{error}</Notice>
      <p className="flex items-start gap-2 text-sm text-ink-soft">
        <Info size={16} className="mt-0.5 flex-none" aria-hidden />
        Figures come from bookings, meal tokens, scans, payments and SOS alerts in the system; today's numbers are so far today. Demo databases include simulated history from "Demo Pilgrim" accounts.
      </p>

      {!data ? (
        <Loading label="Crunching the numbers" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <Kpi label="Bed occupancy" value={`${k.occupancyPct}%`} hint={`${num(k.bedsTotal - k.bedsFree)} of ${num(k.bedsTotal)} beds`} />
            <Kpi label="Beds free" value={num(k.bedsFree)} tone="text-tulsi" />
            <Kpi label="Bed bookings today" value={num(k.bookingsToday)} />
            <Kpi label="Passes scanned today" value={num(k.scansToday)} />
            <Kpi label="Meals served today" value={num(k.mealsServedToday)} hint="people fed" />
            <Kpi label={`Revenue, ${days} days`} value={inr(k.revenue)} hint="after refunds" />
            <Kpi label="Active SOS" value={num(k.openSos)} tone={k.openSos ? 'text-kumkum' : ''} />
            <Kpi label="SOS first response" value={data.sos.avgResponseMin === null ? '–' : `${data.sos.avgResponseMin} min`} hint="average" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Bookings and passes per day"
              subtitle="Camp beds, bus passes and event tickets issued"
              action={csvButton('daily', 'daily activity')}
              table={{ columns: [{ key: 'date', label: 'Date', format: shortDay }, { key: 'lodging', label: 'Beds', num: true }, { key: 'transit', label: 'Bus', num: true }, { key: 'tickets', label: 'Tickets', num: true }], rows: data.daily }}
            >
              <DailyBars data={data.daily} series={[{ key: 'lodging', label: 'Camp beds' }, { key: 'transit', label: 'Bus passes' }, { key: 'tickets', label: 'Event tickets' }]} />
            </ChartCard>

            <ChartCard
              title="Meals served per day"
              subtitle="People fed, counted from scanned meal tokens (a family token counts everyone)"
              action={csvButton('meals', 'meals served')}
              table={{ columns: [{ key: 'date', label: 'Date', format: shortDay }, { key: 'BREAKFAST', label: 'Breakfast', num: true }, { key: 'LUNCH', label: 'Lunch', num: true }, { key: 'DINNER', label: 'Dinner', num: true }], rows: data.meals }}
            >
              <DailyBars data={data.meals} series={[{ key: 'BREAKFAST', label: 'Breakfast' }, { key: 'LUNCH', label: 'Lunch' }, { key: 'DINNER', label: 'Dinner' }]} />
            </ChartCard>

            <ChartCard
              title="Passes scanned per day"
              subtitle="Check-ins at camps, kitchens, buses and event gates (today so far)"
              table={{ columns: [{ key: 'date', label: 'Date', format: shortDay }, { key: 'scans', label: 'Scans', num: true }], rows: data.daily }}
            >
              <DailyLine data={data.daily} dataKey="scans" label="Passes scanned" />
            </ChartCard>

            <ChartCard
              title="Revenue per day"
              subtitle="Paid camps, buses and tickets, after refunds"
              table={{ columns: [{ key: 'date', label: 'Date', format: shortDay }, { key: 'revenue', label: 'Revenue', num: true, format: inr }], rows: data.daily }}
            >
              <DailyBars data={data.daily} series={[{ key: 'revenue', label: 'Revenue' }]} format={inr} yWidth={64} />
            </ChartCard>

            <ChartCard
              title="Occupancy by sector"
              subtitle="Share of beds in use right now, fullest first"
              action={csvButton('sectors', 'sector occupancy')}
              table={{ columns: [{ key: 'name', label: 'Sector' }, { key: 'camps', label: 'Camps', num: true }, { key: 'booked', label: 'Booked', num: true }, { key: 'totalBeds', label: 'Beds', num: true }, { key: 'occupancyPct', label: '%', num: true }], rows: data.sectors }}
            >
              <PercentBars rows={data.sectors} detail={(r) => `${num(r.booked)} / ${num(r.totalBeds)} beds ·`} />
            </ChartCard>

            <ChartCard
              title="SOS response"
              subtitle={`${num(data.sos.total)} alerts in ${days} days · ${num(data.sos.resolved)} resolved`}
              table={{ columns: [{ key: 'type', label: 'Type', format: (t) => SOS_TYPE[t] || t }, { key: 'count', label: 'Alerts', num: true }], rows: data.sos.byType }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-mist p-3">
                  <p className="text-sm text-ink-soft">Average first response</p>
                  <p className="text-2xl font-extrabold tabular-nums">{data.sos.avgResponseMin === null ? '–' : `${data.sos.avgResponseMin} min`}</p>
                </div>
                <div className="rounded-xl bg-mist p-3">
                  <p className="text-sm text-ink-soft">Average time to resolve</p>
                  <p className="text-2xl font-extrabold tabular-nums">{data.sos.avgResolveMin === null ? '–' : `${data.sos.avgResolveMin} min`}</p>
                </div>
              </div>
              <div className="mt-4">
                <PercentBars
                  rows={data.sos.byType.map((t) => ({ name: SOS_TYPE[t.type] || t.type, occupancyPct: data.sos.total ? Math.round((t.count / data.sos.total) * 100) : 0, count: t.count }))}
                  detail={(r) => `${r.count} alerts ·`}
                />
              </div>
            </ChartCard>
          </div>

          <ChartCard
            title="Busiest scan hours"
            subtitle="When pilgrims check in, eat and board (India time). Use it to plan volunteer shifts."
            table={{ columns: [{ key: 'day', label: 'Day' }, ...Array.from({ length: 24 }, (_, h) => ({ key: `h${h}`, label: `${h}`, num: true }))], rows: data.heatmap.days.map((d, i) => ({ day: d, ...Object.fromEntries(data.heatmap.grid[i].map((v, h) => [`h${h}`, v])) })) }}
          >
            <HourHeatmap heatmap={data.heatmap} />
          </ChartCard>
        </>
      )}
    </div>
  );
}

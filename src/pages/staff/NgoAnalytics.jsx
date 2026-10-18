import { useCallback, useEffect, useState } from 'react';
import API, { errorMessage } from '../../lib/api';
import { useLive } from '../../lib/realtime';
import Notice from '../../components/Notice';
import { ChartCard, DailyBars, num, PercentBars, shortDay } from '../../components/charts';

/** NGO portal analytics: this organisation's camps and kitchens over the last 14 days. */
export default function NgoAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    API.get('/analytics/ngo', { params: { days: 14 } })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useLive(['beds', 'meals', 'scan'], load, { wait: 30000 }); // charts change slowly; refresh at most every 30 s

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return null;
  return (
    <section aria-labelledby="ngo-an" className="space-y-4">
      <h2 id="ngo-an" className="text-2xl font-bold">Last 14 days</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Check-ins and meals served"
          subtitle="Camp gate check-ins and people fed at your kitchens, per day"
          table={{ columns: [{ key: 'date', label: 'Date', format: shortDay }, { key: 'checkIns', label: 'Check-ins', num: true }, { key: 'mealsServed', label: 'Meals served', num: true }, { key: 'tokensIssued', label: 'Tokens issued', num: true }], rows: data.daily }}
        >
          <DailyBars data={data.daily} series={[{ key: 'mealsServed', label: 'Meals served' }]} />
          <p className="mt-3 text-sm font-semibold">Camp check-ins</p>
          <DailyBars data={data.daily} series={[{ key: 'checkIns', label: 'Check-ins', color: '#eb6834' }]} height={140} />
        </ChartCard>
        <div className="space-y-4">
          <ChartCard
            title="Beds in use per camp"
            subtitle="Right now, fullest first"
            table={{ columns: [{ key: 'name', label: 'Camp' }, { key: 'booked', label: 'Booked', num: true }, { key: 'totalBeds', label: 'Beds', num: true }, { key: 'occupancyPct', label: '%', num: true }], rows: data.camps }}
          >
            {data.camps.length ? <PercentBars rows={data.camps} detail={(r) => `${num(r.booked)} / ${num(r.totalBeds)} ·`} /> : <p className="text-ink-soft">No camps yet.</p>}
          </ChartCard>
          <ChartCard title="People fed per kitchen" subtitle="Last 14 days">
            {data.kitchens.length ? (
              <PercentBars
                rows={data.kitchens.map((k) => ({ name: k.name, occupancyPct: Math.round((k.served / Math.max(...data.kitchens.map((x) => x.served))) * 100), served: k.served }))}
                detail={(r) => `${num(r.served)} people ·`}
              />
            ) : (
              <p className="text-ink-soft">No meals served yet.</p>
            )}
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

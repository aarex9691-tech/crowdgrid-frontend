import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/*
 * "The big days ahead": the next key dates of every yatra in one short calendar
 * (Amrut Snan at Nashik, Ashadhi Ekadashi at Pandharpur, Rath Yatra at Puri...).
 * Pilgrims plan around these days, and beds and buses go first on them, so the
 * home page shows them plainly: date, what happens, where, and how far away.
 */

const IST = 'Asia/Kolkata';
const fmt = (date, opts) => new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...opts }).format(new Date(date));
const dayKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date(date)); // YYYY-MM-DD in India

/** "Today", "Tomorrow", "In 12 days", "In 8 months" */
function howFar(day, today) {
  const days = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 60) return `In ${days} days`;
  const months = Math.round(days / 30.4);
  return `In ${months} months`;
}

export default function BigDays({ yatras = [], limit = 6 }) {
  // the date is read once when the section appears (reading the clock in every render is impure)
  const [today] = useState(() => dayKey(Date.now()));
  // the next two dates of each yatra (so every yatra is represented), then in date order
  const rows = yatras
    .flatMap((event) =>
      (event.keyDates || [])
        .map((d) => ({ ...d, event, day: dayKey(d.date) }))
        .filter((r) => r.day >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 2)
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, limit);
  if (!rows.length) return null;

  return (
    <section aria-labelledby="days-title" className="cg-shell cg-section">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="cg-kicker text-terracotta-dark">Plan your visit</p>
          <h2 id="days-title" className="cg-h2">The big days ahead</h2>
          <p className="mt-3 max-w-prose text-ink-soft">
            The crowds are largest on these days, and beds and bus seats are booked first. Book early and plan to arrive the evening before.
          </p>
          <Link to="/events?tab=yatras" className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-blue underline-offset-4 hover:underline">
            See every yatra <ArrowRight size={18} aria-hidden />
          </Link>
        </div>

        <ol className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={`${r.event.slug}-${r.label}`}>
              <Link
                to={`/yatra/${r.event.slug}`}
                className="group grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-x-4 py-4 transition-colors hover:bg-white/70 sm:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:px-3"
              >
                <time dateTime={r.day} className="row-span-2 text-center leading-none sm:row-span-1">
                  <span className="block font-display text-[2.4rem] text-ink">{fmt(r.date, { day: 'numeric' })}</span>
                  <span className="mt-1.5 block text-sm font-semibold text-ink-soft">{fmt(r.date, { month: 'short', year: 'numeric' })}</span>
                </time>
                <span className="min-w-0">
                  <span className="block font-bold text-ink group-hover:underline group-hover:underline-offset-4">{r.label}</span>
                  <span className="block text-ink-soft">
                    {r.event.title}
                    {r.event.city ? `, ${r.event.city}` : ''}
                  </span>
                </span>
                <span className="col-start-2 mt-1 text-[0.95rem] font-semibold text-terracotta-dark sm:col-start-auto sm:mt-0 sm:text-right">
                  {howFar(r.day, today)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

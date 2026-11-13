import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { fmtDate } from '../lib/format';

/**
 * The key dates of a yatra as chips on a dark header. By default only the main
 * snan (bathing) dates; with `all`, every upcoming key date (or every date once
 * they are all past, so the header is never empty).
 */
export default function SnanDates({ event, all = false }) {
  // "now" is read once when the header mounts (reading the clock during every render is impure)
  const [since] = useState(() => Date.now() - 864e5);
  const list = event?.keyDates || [];
  let dates;
  if (all) {
    const upcoming = list.filter((d) => new Date(d.date) >= new Date(since));
    dates = upcoming.length ? upcoming : list;
  } else {
    dates = list.filter((d) => /snan/i.test(d.label));
  }
  if (!dates.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label={all ? 'Key dates' : 'Main snan dates'}>
      {dates.map((d) => (
        <li key={d.label} className="inline-flex items-center gap-2 rounded-full border border-saffron-light/50 bg-white/15 px-4 py-1.5 text-sm sm:text-base text-white shadow-xs backdrop-blur-sm">
          <CalendarDays size={14} className="text-saffron-light" aria-hidden />
          <span className="font-bold">{d.label}</span>
          <span className="text-blue-mist">{fmtDate(d.date)}</span>
        </li>
      ))}
    </ul>
  );
}

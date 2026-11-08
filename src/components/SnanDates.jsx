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
        <li key={d.label} className="inline-flex items-center gap-1.5 rounded-full border border-marigold/50 bg-white/10 px-3 py-1 text-sm text-white">
          <CalendarDays size={14} className="text-marigold" aria-hidden />
          <span className="font-semibold">{d.label}</span>
          <span className="text-[#e6dccf]">{fmtDate(d.date)}</span>
        </li>
      ))}
    </ul>
  );
}

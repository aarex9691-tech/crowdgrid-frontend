import { CalendarDays } from 'lucide-react';
import { fmtDate } from '../lib/format';

/** The main bathing (Amrut / Shahi Snan) dates of a yatra, as chips on a dark header. */
export default function SnanDates({ event }) {
  const dates = (event?.keyDates || []).filter((d) => /snan/i.test(d.label));
  if (!dates.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Main snan dates">
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

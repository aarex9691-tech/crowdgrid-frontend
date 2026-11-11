import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Siren } from 'lucide-react';
import { homeFor, useAuth } from '../../lib/auth';
import { useT } from '../../lib/i18n';

/** One entry per role: where that role works, and which preview to draw. Text lives in homeStrings.js. */
const ROLES = [
  { id: 'USER', path: '/passbook', mock: 'pass' },
  { id: 'VOLUNTEER', path: '/scan', mock: 'scan' },
  { id: 'NGO_ADMIN', path: '/ngo', mock: 'beds' },
  { id: 'CORPORATE_ADMIN', path: '/corporate-admin', mock: 'guests' },
  { id: 'AUTHORITY', path: '/control', mock: 'control' },
  { id: 'SUPER_ADMIN', path: '/control', mock: 'admin' },
];

function Bar({ label, value, tone }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 font-semibold text-[#4A4F5E]">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EEE9E0]">
        <span className="block h-full rounded-full" style={{ width: `${value}%`, background: tone }} />
      </span>
      <span className="w-8 text-right font-bold tabular-nums">{value}%</span>
    </div>
  );
}

/** A small drawing of each dashboard, made of plain boxes. Not interactive. */
function Mock({ kind }) {
  if (kind === 'pass') {
    return (
      <div className="flex gap-4">
        <div className="grid size-28 shrink-0 grid-cols-5 gap-0.5 rounded-lg bg-white p-2 ring-1 ring-[#E7E1D7]" aria-hidden>
          {Array.from({ length: 25 }).map((_, i) => (
            <span key={i} className={[0, 1, 3, 5, 6, 8, 12, 14, 16, 18, 19, 20, 22, 24].includes(i) ? 'bg-[#1B1E28]' : 'bg-transparent'} />
          ))}
        </div>
        <ul className="flex-1 space-y-2 text-sm">
          <li className="rounded-lg bg-white px-3 py-2 ring-1 ring-[#E7E1D7]"><b>Stay</b> · Tent B-12, 2 beds</li>
          <li className="rounded-lg bg-white px-3 py-2 ring-1 ring-[#E7E1D7]"><b>Meal</b> · Lunch token × 4</li>
          <li className="rounded-lg bg-white px-3 py-2 ring-1 ring-[#E7E1D7]"><b>Ticket</b> · Evening show, Row C</li>
        </ul>
      </div>
    );
  }
  if (kind === 'scan') {
    return (
      <div className="flex items-center gap-4">
        <div className="relative grid size-32 shrink-0 place-items-center rounded-xl bg-[#1B1E28]" aria-hidden>
          <span className="absolute inset-4 rounded-md border-2 border-dashed border-white/40" />
          <span className="grid size-14 place-items-center rounded-full bg-[#0D6331] text-white"><Check size={30} strokeWidth={3} /></span>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-lg font-bold text-[#0D6331]">Valid pass</p>
          <p>Group of 4 · Lunch token</p>
          <p className="text-[#4A4F5E]">Scanned 212 today</p>
        </div>
      </div>
    );
  }
  if (kind === 'beds') {
    return (
      <div>
        <div className="grid grid-cols-10 gap-1" aria-hidden>
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className={`h-5 rounded ${i % 7 === 0 || i % 5 === 2 ? 'bg-[#E7E1D7]' : 'bg-[#138A43]'}`} />
          ))}
        </div>
        <p className="mt-3 text-sm"><b>29 of 40</b> beds booked tonight · <b>1,180</b> meals left</p>
      </div>
    );
  }
  if (kind === 'guests') {
    return (
      <ul className="space-y-2 text-sm">
        {[
          ['A. Sharma', 'Checked in', 'ok'],
          ['R. Iyer', 'Checked in', 'ok'],
          ['M. Khan', 'Invited', 'wait'],
          ['P. Dsouza', 'Invited', 'wait'],
        ].map(([n, s, t]) => (
          <li key={n} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-[#E7E1D7]">
            <span className="font-semibold">{n}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t === 'ok' ? 'bg-[#E5F3EA] text-[#0D6331]' : 'bg-[#E7EDF9] text-[#1F3F8F]'}`}>{s}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (kind === 'control') {
    return (
      <div className="space-y-2.5">
        <Bar label="Sector 1" value={86} tone="#C8102E" />
        <Bar label="Sector 2" value={64} tone="#E36F1E" />
        <Bar label="Sector 3" value={38} tone="#138A43" />
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#FBEAEA] px-3 py-2 text-sm font-semibold text-[#9E1F1F]">
          <Siren size={16} aria-hidden /> SOS · Medical · Gate 4 · 2 min ago
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['12', 'Live events', 'bg-[#FDEEDF] text-[#8A3F0B]'], ['3', 'NGOs to verify', 'bg-[#E7EDF9] text-[#1F3F8F]'], ['1', 'Open SOS', 'bg-[#FBEAEA] text-[#9E1F1F]']].map(([n, l, c]) => (
          <span key={l} className={`rounded-lg px-2 py-3 ${c}`}>
            <b className="block text-xl tabular-nums">{n}</b>
            <span className="text-xs font-semibold">{l}</span>
          </span>
        ))}
      </div>
      <ul className="space-y-1.5 text-sm">
        {[['Pilgrimage', 'Simhastha Kumbh', '#E36F1E'], ['Public', 'Riverfront music night', '#1F3F8F'], ['Corporate', 'Annual partner summit', '#138A43']].map(([k, n, c]) => (
          <li key={n} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[#E7E1D7]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: c }} />
            <span className="font-semibold">{n}</span>
            <span className="ml-auto text-xs text-[#4A4F5E]">{k}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RoleDashboards() {
  const { user } = useAuth();
  const t = useT();
  const [active, setActive] = useState(0);
  const tabs = useRef([]);
  const role = ROLES[active];
  const name = t(`role.${role.id}`);

  // Arrow keys move between tabs, as screen-reader users expect
  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + ROLES.length) % ROLES.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const mine = user?.role === role.id;
  const action = mine
    ? { to: role.id === 'USER' ? role.path : homeFor(role.id), label: t('home.openDashboard') }
    : !user && role.id === 'USER'
      ? { to: '/register', label: t('roles.signup') }
      : !user
        ? { to: '/login', label: t('roles.staffLogin') }
        : null;

  return (
    <section aria-labelledby="roles-title" className="cg-section">
      <div className="max-w-2xl">
        <p className="cg-kicker text-[#1F3F8F]">{t('roles.kicker')}</p>
        <h2 id="roles-title" className="cg-h2">{t('roles.title')}</h2>
        <p className="mt-2 text-[#4A4F5E]">{t('roles.lead')}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_1fr]">
        {/* All six roles stay visible: a 2 or 3 column grid on phones and tablets, a column on desktop */}
        <div role="tablist" aria-label={t('roles.list')} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col" onKeyDown={onKey}>
          {ROLES.map((r, i) => (
            <button
              key={r.id}
              ref={(el) => { tabs.current[i] = el; }}
              id={`role-tab-${r.id}`}
              role="tab"
              type="button"
              aria-selected={i === active}
              aria-controls="role-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`min-h-12 rounded-xl px-4 text-left font-semibold transition-colors ${
                i === active ? 'bg-[#1F3F8F] text-white' : 'bg-white text-[#1B1E28] ring-1 ring-[#E7E1D7] hover:ring-[#1F3F8F]'
              }`}
            >
              {t(`role.${r.id}`)}
            </button>
          ))}
        </div>

        <div
          id="role-panel"
          role="tabpanel"
          aria-labelledby={`role-tab-${role.id}`}
          className="grid items-center gap-6 rounded-3xl bg-white p-5 ring-1 ring-[#E7E1D7] sm:p-8 md:grid-cols-2"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#4A4F5E]">{t(`role.${role.id}.who`)}</p>
            <h3 className="mt-1 text-2xl font-bold">{name}</h3>
            <ul className="mt-4 space-y-2.5">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex gap-2.5">
                  <Check size={20} className="mt-0.5 shrink-0 text-[#0D6331]" aria-hidden />
                  <span>{t(`role.${role.id}.${n}`)}</span>
                </li>
              ))}
            </ul>
            {action && (
              <Link to={action.to} className="cg-btn cg-btn-blue mt-6">
                {action.label} <ArrowRight size={18} aria-hidden />
              </Link>
            )}
          </div>
          <div className="rounded-2xl bg-[#FAF8F4] p-4 ring-1 ring-[#E7E1D7]" role="img" aria-label={t('roles.preview', { role: name })}>
            <div className="mb-3 flex items-center gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#E36F1E]" />
              <span className="size-2.5 rounded-full bg-[#E7E1D7]" />
              <span className="size-2.5 rounded-full bg-[#138A43]" />
            </div>
            <Mock kind={role.mock} />
          </div>
        </div>
      </div>
    </section>
  );
}

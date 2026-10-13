import { BedDouble, Briefcase, BusFront, HandHeart, Ticket, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import QrCode from './QrCode';
import { fmtDate, fmtDateTime } from '../lib/format';

const day = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? fmtDate(`${d}T12:00:00+05:30`, { year: undefined }) : d);

export const PASS_META = {
  LODGING: { label: 'Lodging pass', icon: BedDouble },
  MEAL: { label: 'Meal token', icon: UtensilsCrossed },
  TRANSIT: { label: 'Boarding pass', icon: BusFront },
  PUBLIC: { label: 'Entry pass', icon: Ticket },
  CORPORATE: { label: 'Corporate badge', icon: Briefcase },
  VOLUNTEER: { label: 'Volunteer ID', icon: HandHeart },
};

const STATE = {
  ACTIVE: { cls: 'pill-ok', text: 'Ready to scan' },
  UPCOMING: { cls: 'pill-low', text: 'Not open yet' },
  REDEEMED: { cls: 'pill-quiet', text: 'Used' },
  EXPIRED: { cls: 'pill-quiet', text: 'Expired' },
  CANCELLED: { cls: 'pill-out', text: 'Cancelled' },
};

const detailRows = (pass) => {
  const d = pass.details || {};
  const rows = [];
  if (d.location) rows.push(['Your bed', d.location]);
  if (d.beds) rows.push(['Beds', d.beds]);
  if (d.people > 1) rows.push(['People', d.people]);
  if (d.paid) rows.push(['Paid', `₹${d.paid}`]);
  if (d.menu?.length && pass.type === 'MEAL') rows.push(['Menu', d.menu.join(', ')]);
  if (d.guests?.length) rows.push([pass.type === 'MEAL' ? 'Names' : 'Guests', d.guests.join(', ')]);
  if (d.checkIn) rows.push(['Stay', d.checkIn === d.checkOut ? day(d.checkIn) : `${day(d.checkIn)} to ${day(d.checkOut)}`]);
  if (d.gate) rows.push(['Board at', d.gate]);
  if (d.fare !== undefined && pass.type === 'TRANSIT') rows.push(['Fare', d.fare ? `₹${d.fare}` : 'Free seva']);
  if (d.sessions?.length) rows.push(['Sessions', d.sessions.join(', ')]);
  if (d.trust) rows.push(['Trust', d.trust]);
  if (d.domain && pass.type === 'VOLUNTEER') rows.push(['Seva', d.domain]);
  return rows;
};

export default function PassCard({ pass, expanded = true }) {
  const meta = PASS_META[pass.type] || PASS_META.PUBLIC;
  const state = STATE[pass.state] || STATE.ACTIVE;
  const showQr = expanded && pass.qr && (pass.state === 'ACTIVE' || pass.state === 'UPCOMING');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pass.qr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the QR still works */
    }
  };

  return (
    <article className="panel overflow-hidden">
      <div className="flex items-start gap-3 border-b border-dashed border-line p-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
          <meta.icon size={22} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-ink-soft">
            {meta.label}
            <span className={state.cls}>{state.text}</span>
          </p>
          <h3 className="text-lg font-bold leading-snug">{pass.title}</h3>
          {pass.subtitle && <p className="text-ink-soft">{pass.subtitle}</p>}
        </div>
      </div>

      {showQr && (
        <div className="flex flex-col items-center gap-2 bg-white p-5">
          <QrCode value={pass.qr} label={`${meta.label} QR for ${pass.title}`} />
          <p className="text-center text-sm text-ink-soft">Show this at the gate or counter. Turn your screen brightness up.</p>
          <button type="button" onClick={copy} className="text-sm font-semibold text-dusk underline">
            {copied ? 'Pass code copied' : 'Copy pass code'}
          </button>
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3 text-[15px]">
        {detailRows(pass).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
        <dt className="text-ink-soft">Valid</dt>
        <dd className="font-medium">
          {fmtDateTime(pass.validFrom)} to {fmtDateTime(pass.validUntil)}
        </dd>
        {pass.redeemedAt && (
          <>
            <dt className="text-ink-soft">Used at</dt>
            <dd className="font-medium">{fmtDateTime(pass.redeemedAt)}</dd>
          </>
        )}
      </dl>
    </article>
  );
}

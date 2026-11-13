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

// Stub colour follows the kind of gathering: saffron for yatra services, blue for public
// events, green for corporate badges. Staff IDs are navy. Spent passes turn grey.
const TONE = { LODGING: '#e36f1e', MEAL: '#e36f1e', TRANSIT: '#e36f1e', PUBLIC: '#1f3f8f', CORPORATE: '#138a43', VOLUNTEER: '#0f1a3c' };
const SPENT = ['REDEEMED', 'EXPIRED', 'CANCELLED'];

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
  if (pass.state === 'CANCELLED' && pass.refund) rows.push(['Refund', pass.refund.amount ? `₹${pass.refund.amount} (${pass.refund.percent}%), to your original payment method` : d.paid ? 'None (cancelled within 24 hours)' : 'Free pass, nothing to refund']);
  if (pass.cancelledAt) rows.push(['Cancelled', fmtDateTime(pass.cancelledAt)]);
  if (d.menu?.length && pass.type === 'MEAL') rows.push(['Menu', d.menu.join(', ')]);
  if (d.guests?.length) rows.push([pass.type === 'MEAL' ? 'Names' : 'Guests', d.guests.join(', ')]);
  if (d.checkIn) rows.push(['Stay', d.checkIn === d.checkOut ? day(d.checkIn) : `${day(d.checkIn)} to ${day(d.checkOut)}`]);
  if (d.date && pass.type === 'TRANSIT') rows.push(['Travel day', day(d.date)]);
  if (d.gate) rows.push(['Board at', d.gate]);
  if (d.fare !== undefined && pass.type === 'TRANSIT') rows.push(['Fare', d.fare ? `₹${d.fare}` : 'Free seva']);
  if (d.sessions?.length) rows.push(['Sessions', d.sessions.join(', ')]);
  if (d.trust) rows.push(['Trust', d.trust]);
  if (d.domain && pass.type === 'VOLUNTEER') rows.push(['Seva', d.domain]);
  return rows;
};

// Passes a pilgrim can cancel from the passbook (badges and volunteer IDs are managed by the organiser)
export const CANCELLABLE = ['LODGING', 'MEAL', 'TRANSIT', 'PUBLIC'];

export default function PassCard({ pass, expanded = true, onCancel }) {
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
    <article data-no-translate className="cg-ticket" style={{ '--ticket-tone': SPENT.includes(pass.state) ? '#dde2ec' : TONE[pass.type] || TONE.PUBLIC }}>
      <span className="cg-ticket-stub" aria-hidden />
      <div className="cg-ticket-body">
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
          <meta.icon size={22} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-ink-soft">
            {meta.label}
            <span className="flex flex-wrap gap-1.5">
              {pass.details?.prebooked && <span className="pill-quiet">Pre-booked</span>}
              <span className={state.cls}>{state.text}</span>
            </span>
          </p>
          <h3 className="text-lg font-bold leading-snug">{pass.title}</h3>
          {pass.subtitle && <p className="text-ink-soft">{pass.subtitle}</p>}
        </div>
      </div>

      {showQr && (
        <div className="cg-ticket-tear flex flex-col items-center gap-2 p-5">
          <QrCode value={pass.qr} label={`${meta.label} QR for ${pass.title}`} />
          <p className="text-center text-sm text-ink-soft">Show this at the gate or counter. Turn your screen brightness up.</p>
          <button type="button" onClick={copy} className="min-h-11 text-sm font-semibold text-blue underline underline-offset-4">
            {copied ? 'Pass code copied' : 'Copy pass code'}
          </button>
        </div>
      )}

      <dl className="cg-ticket-tear grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3 text-[15px]">
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
      {onCancel && CANCELLABLE.includes(pass.type) && pass.state === 'UPCOMING' && (
        <div className="border-t border-line px-4 py-3">
          <button type="button" className="min-h-11 text-sm font-semibold text-kumkum underline-offset-4 hover:underline" onClick={() => onCancel(pass)}>
            Cancel this {pass.type === 'LODGING' ? 'stay' : pass.type === 'MEAL' ? 'meal token' : pass.type === 'TRANSIT' ? 'bus pass' : 'ticket'}
          </button>
        </div>
      )}
      </div>
    </article>
  );
}

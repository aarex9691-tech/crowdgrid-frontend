import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { rupees } from '../lib/cart';
import Notice from './Notice';

/**
 * The cancel pop-up: loads the server's quote (deadline, charge, refund) for
 * this pass, shows the policy, and cancels only after the pilgrim confirms.
 */
export default function CancelPassDialog({ pass, onClose, onDone }) {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now()); // fixed when the pop-up opens
  const keepRef = useRef(null);

  useEffect(() => {
    API.get(`/passes/${pass._id}/cancel-quote`).then(({ data }) => setQuote(data)).catch((e) => setError(errorMessage(e)));
  }, [pass._id]);
  useEffect(() => {
    keepRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirm = async () => {
    setBusy(true);
    try {
      const { data } = await API.post(`/passes/${pass._id}/cancel`);
      onDone(data);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const paid = quote?.paid > 0;
  const tier = (until) => until && new Date(until).getTime() > now;

  return createPortal(
    <div className="cg-backdrop fixed inset-0 z-[1000] flex items-end justify-center bg-ink/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="cancel-title" className="cg-dialog panel w-full max-w-md p-6 shadow-2xl" data-testid="cancel-dialog">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-kumkum-wash text-kumkum">
            <AlertTriangle size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="cancel-title" className="text-xl font-bold">Cancel this pass?</h2>
            <p className="mt-0.5 text-ink-soft">{pass.title}</p>
          </div>
        </div>

        {error && <Notice tone="error" className="mt-4">{error}</Notice>}
        {!quote && !error && <p className="mt-4 text-ink-soft">Checking your refund…</p>}

        {quote && !quote.cancellable && <Notice className="mt-4">{quote.reason}</Notice>}

        {quote?.cancellable && (
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <CalendarClock size={16} aria-hidden /> Starts {fmtDateTime(quote.startsAt)}
            </p>
            {paid ? (
              <>
                <dl className="grid grid-cols-[1fr_auto] gap-y-1 rounded-xl bg-mist p-4">
                  <dt>You paid</dt><dd className="text-right font-semibold">{rupees(quote.paid)}</dd>
                  <dt>Cancellation charge</dt><dd className="text-right font-semibold">{rupees(quote.charge)}</dd>
                  <dt className="border-t border-line pt-1 font-bold">Refund ({quote.percent}%)</dt>
                  <dd className="border-t border-line pt-1 text-right text-lg font-extrabold text-tulsi" data-testid="refund-amount">{rupees(quote.refund)}</dd>
                </dl>
                <ul className="space-y-1 text-sm" aria-label="Refund policy">
                  <li className={tier(quote.fullRefundUntil) ? 'font-semibold' : 'text-ink-faint line-through'}>
                    Full refund until {fmtDateTime(quote.fullRefundUntil)}
                  </li>
                  <li className={!tier(quote.fullRefundUntil) && tier(quote.halfRefundUntil) ? 'font-semibold' : tier(quote.halfRefundUntil) ? '' : 'text-ink-faint line-through'}>
                    50% refund until {fmtDateTime(quote.halfRefundUntil)}
                  </li>
                  <li className={!tier(quote.halfRefundUntil) ? 'font-semibold' : ''}>No refund after that</li>
                </ul>
                <p className="text-sm text-ink-soft">Refunds go back to your original payment method in 5 to 7 working days.</p>
              </>
            ) : (
              <p className="rounded-xl bg-mist p-4">{quote.policy}</p>
            )}
            <p className="text-sm text-ink-soft">The QR for this pass stops working straight away. This cannot be undone.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={keepRef} type="button" className="btn-ghost" onClick={onClose}>Keep my pass</button>
          {quote?.cancellable && (
            <button type="button" className="btn-sos" disabled={busy} onClick={confirm}>
              {busy ? 'Cancelling…' : paid ? `Cancel and refund ${rupees(quote.refund)}` : 'Cancel pass'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

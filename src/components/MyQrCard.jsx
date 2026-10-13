import { useEffect, useState } from 'react';
import { QrCode as QrIcon, RefreshCw } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import QrCode from './QrCode';

const KEY = 'cg_myqr';
const readCached = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const saveCached = (qr) => {
  try {
    localStorage.setItem(KEY, qr);
  } catch {
    /* storage blocked */
  }
};

/**
 * "One QR for everything": volunteers scan this single code at any camp gate,
 * food counter or bus gate, and the server redeems the matching pass.
 * Cached on the phone so it shows offline too.
 */
export default function MyQrCard({ name, activeCount }) {
  const [qr, setQr] = useState(readCached);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    API.get('/passes/my-qr')
      .then(({ data }) => {
        setQr(data.qr);
        saveCached(data.qr);
      })
      .catch((e) => {
        if (!readCached()) setError(errorMessage(e));
      });
  }, []);

  const reset = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await API.post('/passes/my-qr/reset');
      setQr(data.qr);
      saveCached(data.qr);
      setConfirmReset(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel overflow-hidden" aria-labelledby="myqr-title">
      <div className="toran" aria-hidden />
      <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-line bg-white p-3">
          {qr ? <QrCode value={qr} size={200} label={`Personal QR for ${name}`} /> : <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-mist" />}
        </div>
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-kumkum sm:justify-start">
            <QrIcon size={18} aria-hidden /> One QR for everything
          </p>
          <h2 id="myqr-title" className="text-2xl font-bold">{name}</h2>
          <p className="text-ink-soft">
            Show this single code at any camp gate, food counter or bus gate. The volunteer's scanner finds the right pass
            {activeCount ? ` among your ${activeCount} active pass${activeCount > 1 ? 'es' : ''}` : ''} and marks it used.
          </p>
          {error && <p className="text-sm font-semibold text-kumkum" role="alert">{error}</p>}
          {confirmReset ? (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-sm">Old copies and screenshots will stop working.</span>
              <button type="button" className="btn-ink min-h-10 px-3" disabled={busy} onClick={reset}>{busy ? 'Resetting…' : 'Yes, reset'}</button>
              <button type="button" className="btn-ghost min-h-10 px-3" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft underline" onClick={() => setConfirmReset(true)}>
              <RefreshCw size={14} aria-hidden /> Lost your phone or shared a screenshot? Reset this QR
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { QrCode as QrIcon, RefreshCw } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import QrCode from './QrCode';
import Avatar from './Avatar';
import { useT } from '../lib/i18n';

const KEY = 'cg_myqr';
const LIVE_KEY = 'cg_myqr_live';
const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage blocked */
  }
};
const readLive = () => {
  try {
    return JSON.parse(read(LIVE_KEY) || 'null');
  } catch {
    return null;
  }
};

const canMakeLive = () => typeof window !== 'undefined' && !!window.crypto?.subtle && window.isSecureContext;

const b64url = (buf) => {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Live QR code, same maths as the server (utils/passToken.js):
 *   CGL.<userId>.<window>.<HMAC-SHA256(liveKey, window)>   window = 30-second step
 * Made on the phone, so it keeps changing with no network.
 */
async function liveQr(live, nowMs) {
  const step = Math.floor(nowMs / 1000 / live.periodS);
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey('raw', enc.encode(live.key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(String(step)));
  return `CGL.${live.userId}.${step}.${b64url(sig).slice(0, 16)}`;
}

/**
 * "One QR for everything": volunteers scan this single code at any camp gate,
 * food counter or bus gate, and the server redeems the matching pass.
 * It changes every 30 seconds, so a screenshot sent to someone else stops working
 * within about a minute. Works offline (the key is kept on the phone).
 */
export default function MyQrCard({ name, photoUrl, activeCount }) {
  const t = useT();
  const [staticQr, setStaticQr] = useState(() => read(KEY));
  const [live, setLive] = useState(readLive);
  const [code, setCode] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const store = (data) => {
    setStaticQr(data.qr);
    save(KEY, data.qr);
    if (data.live) {
      setLive(data.live);
      save(LIVE_KEY, JSON.stringify(data.live));
    }
  };

  useEffect(() => {
    API.get('/passes/my-qr')
      .then(({ data }) => store(data))
      .catch((e) => {
        if (!read(KEY)) setError(errorMessage(e));
      });
  }, []);

  // Recompute the live code every second (it only changes every 30 s; the countdown moves each second)
  useEffect(() => {
    if (!live || !canMakeLive()) return undefined;
    let stopped = false;
    const tick = async () => {
      const now = Date.now();
      const period = live.periodS * 1000;
      setSecondsLeft(Math.ceil((period - (now % period)) / 1000));
      try {
        const next = await liveQr(live, now);
        if (!stopped) setCode((c) => (c === next ? c : next));
      } catch {
        if (!stopped) setCode(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [live]);

  const reset = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await API.post('/passes/my-qr/reset');
      store(data);
      setConfirmReset(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shown = code || staticQr;
  const isLive = !!code;

  return (
    <section className="panel overflow-hidden" aria-labelledby="myqr-title">
      <div className="toran" aria-hidden />
      <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl border border-line bg-white p-3">
            {shown ? <QrCode value={shown} size={200} label={`Personal QR for ${name}`} /> : <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-mist" />}
          </div>
          {isLive && (
            <p className="text-sm font-semibold text-tulsi" aria-live="off">
              {t('qr.live', { n: secondsLeft })}
            </p>
          )}
        </div>
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-kumkum sm:justify-start">
            <QrIcon size={18} aria-hidden /> {t('qr.oneQr')}
          </p>
          <div className="flex items-center gap-3">
            {photoUrl && <Avatar name={name} photoUrl={photoUrl} size={48} />}
            <h2 id="myqr-title" className="text-2xl font-bold">{name}</h2>
          </div>
          <p className="text-ink-soft">
            {t('qr.show')}
            {activeCount ? ` (${activeCount})` : ''}
          </p>
          <p className="text-sm text-ink-soft">
            {isLive ? t('qr.liveNote') : t('qr.staticNote')}
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
              <RefreshCw size={14} aria-hidden /> {t('qr.reset')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

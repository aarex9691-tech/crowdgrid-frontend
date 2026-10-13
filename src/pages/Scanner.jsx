import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, CircleCheck, CircleX } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { PASS_META } from '../components/PassCard';
import Notice from '../components/Notice';

const READER_ID = 'qr-reader';

/**
 * Ground volunteer scanner (screen 9 / FR-12). Uses the phone camera in the
 * browser; no app install. Every decision is made by the server, which checks
 * the HMAC signature and redeems the pass atomically.
 */
export default function Scanner() {
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ text: '', at: 0 });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [log, setLog] = useState([]);

  const check = useCallback(async (qr) => {
    if (busyRef.current) return;
    // Ignore the same code read repeatedly while it is still in front of the camera
    if (lastRef.current.text === qr && Date.now() - lastRef.current.at < 4000) return;
    lastRef.current = { text: qr, at: Date.now() };
    busyRef.current = true;
    setError('');
    const started = performance.now();
    try {
      const { data } = await API.post('/passes/scan', { qr });
      const ms = Math.round(performance.now() - started);
      setResult({ ...data, ms });
      setLog((l) => [{ ...data, at: new Date() }, ...l].slice(0, 8));
      if (navigator.vibrate) navigator.vibrate(data.result === 'VALID' ? 80 : [60, 60, 60]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busyRef.current = false;
    }
  }, []);

  const start = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => check(text), () => {});
      setRunning(true);
    } catch (e) {
      setError(
        window.isSecureContext
          ? `Could not open the camera: ${e?.message || e}. Allow camera access, or type the code below.`
          : 'The camera needs a secure (https) page. On a phone, open the app with "npm run dev:phone", or type the code below.'
      );
    }
  };

  const stop = async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* already stopped */
    }
    setRunning(false);
  };

  useEffect(() => () => { stop(); }, []);

  const valid = result?.result === 'VALID';

  return (
    <div className="shell max-w-xl space-y-5 py-6">
      <div>
        <h1 className="text-3xl font-bold">Pass scanner</h1>
        <p className="text-ink-soft">Point the camera at a pilgrim's QR. Green means let them in.</p>
      </div>

      {result && (
        <div
          role="status"
          aria-live="assertive"
          className={`rounded-3xl p-6 text-white ${valid ? 'bg-tulsi' : 'bg-kumkum'}`}
        >
          <div className="flex items-center gap-3">
            {valid ? <CircleCheck size={44} aria-hidden /> : <CircleX size={44} aria-hidden />}
            <div>
              <p className="text-2xl font-extrabold">{valid ? result.message : 'REJECTED'}</p>
              {!valid && <p className="text-lg font-semibold">{result.message}</p>}
            </div>
          </div>
          {result.pass && (
            <div className="mt-4 rounded-2xl bg-white/15 p-4">
              <p className="text-sm opacity-90">{PASS_META[result.pass.type]?.label}</p>
              <p className="text-xl font-bold">{result.pass.title}</p>
              {result.pass.subtitle && <p>{result.pass.subtitle}</p>}
              {result.pass.holder && <p className="mt-1">Holder: {result.pass.holder.name} ({result.pass.holder.phone})</p>}
              {result.pass.details?.people > 1 && <p className="mt-2 text-2xl font-extrabold">Serve {result.pass.details.people} plates</p>}
              {result.pass.details?.tent && (
                <p className="mt-2 text-2xl font-extrabold">
                  {result.pass.details.tent}
                  {result.pass.details.bedNumbers?.length ? ` · Bed ${result.pass.details.bedNumbers.join(', ')}` : ''}
                </p>
              )}
              {result.pass.details?.guests?.length > 0 && <p>Names: {result.pass.details.guests.join(', ')}</p>}
            </div>
          )}
          <p className="mt-3 text-sm opacity-90">Checked in {result.ms} ms</p>
        </div>
      )}
      <Notice tone="error">{error}</Notice>

      <div className="panel overflow-hidden">
        <div id={READER_ID} className={running ? 'min-h-64' : ''} />
        <div className="flex gap-3 p-4">
          {running ? (
            <button type="button" className="btn-ghost flex-1" onClick={stop}>
              <CameraOff size={20} aria-hidden /> Stop camera
            </button>
          ) : (
            <button type="button" className="btn-ink flex-1 text-lg" onClick={start}>
              <Camera size={20} aria-hidden /> Start camera
            </button>
          )}
        </div>
      </div>

      <form
        className="panel space-y-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          lastRef.current = { text: '', at: 0 };
          check(manual.trim());
        }}
      >
        <label htmlFor="manual" className="field-label">Camera not working? Paste or type the pass code</label>
        <input id="manual" className="field font-mono text-sm" placeholder="CG1.…" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button type="submit" className="btn-ghost" disabled={!manual.trim()}>Check pass</button>
      </form>

      {log.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Recent scans</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
            {log.map((l, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2">
                <span className={l.result === 'VALID' ? 'pill-ok' : 'pill-out'}>{l.result === 'VALID' ? 'Valid' : 'Rejected'}</span>
                <span className="flex-1 truncate">{l.pass?.title || l.message}</span>
                <span className="text-sm text-ink-soft">{fmtDateTime(l.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

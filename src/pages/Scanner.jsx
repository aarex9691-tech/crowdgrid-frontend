import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CircleCheck, CircleX } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { PASS_META } from '../components/PassCard';
import Notice from '../components/Notice';
import PageTitle from '../components/PageTitle';
import Avatar from '../components/Avatar';
import MyDutyCard from '../components/MyDutyCard';

const READER_ID = 'qr-reader';

// Where this scanner is standing: decides which pass a personal QR redeems
const SERVICES = [
  { id: 'ANY', label: 'Any' },
  { id: 'FOOD', label: 'Food counter' },
  { id: 'LODGING', label: 'Camp gate' },
  { id: 'TRANSIT', label: 'Bus gate' },
  { id: 'ENTRY', label: 'Event entry' },
  { id: 'VOLUNTEER', label: 'Volunteer ID' },
];
const SERVICE_KEY = 'cg_scan_service';
const savedService = () => {
  try {
    return localStorage.getItem(SERVICE_KEY) || 'ANY';
  } catch {
    return 'ANY';
  }
};

/**
 * Ground volunteer scanner (screen 9 / FR-12). Uses the phone camera in the
 * browser; no app install. Every decision is made by the server, which checks
 * the HMAC signature and redeems the pass atomically.
 */
/** Who the pass belongs to: their photo (if they added one) so the volunteer can match the face. */
function HolderId({ holder, light = false }) {
  return (
    <div className={`mt-4 flex items-center gap-4 rounded-2xl p-3 ${light ? 'bg-white' : 'bg-white/15'}`}>
      <Avatar name={holder.name} photoUrl={holder.photoUrl} size={88} alt={holder.photoUrl ? `Photo of ${holder.name}` : ''} />
      <div className="min-w-0">
        <p className="text-sm opacity-90">Holder</p>
        <p className="truncate text-xl font-bold">{holder.name}</p>
        {holder.phone && <p className="tabular-nums">{holder.phone}</p>}
        <p className="mt-1 text-sm font-semibold">{holder.photoUrl ? 'Match the face with the photo.' : 'No photo on file: check their ID.'}</p>
      </div>
    </div>
  );
}

export default function Scanner() {
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ text: '', at: 0 });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [log, setLog] = useState([]);
  const [service, setService] = useState(savedService);
  const serviceRef = useRef(service);
  const chooseService = (id) => {
    setService(id);
    serviceRef.current = id;
    try {
      localStorage.setItem(SERVICE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const check = useCallback(async (qr, passId) => {
    if (busyRef.current) return;
    // Ignore the same code read repeatedly while it is still in front of the camera
    if (!passId && lastRef.current.text === qr && Date.now() - lastRef.current.at < 4000) return;
    lastRef.current = { text: qr, at: Date.now() };
    busyRef.current = true;
    setError('');
    setResult(null); // never leave the previous pilgrim's VALID card up while this scan runs or if it fails
    const started = performance.now();
    try {
      const { data } = await API.post('/passes/scan', { qr, service: serviceRef.current, passId });
      const ms = Math.round(performance.now() - started);
      setResult({ ...data, ms, qr, at: Date.now() }); // `at` gives every scan its own flash
      if (data.result === 'CHOOSE') return;
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
      // the camera library is large: download it only when the camera is started (typed codes need none)
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => check(text), () => {});
      setRunning(true);
    } catch (e) {
      setError(
        window.isSecureContext
          ? `Could not open the camera: ${e?.message || e}. Allow camera access, or type the code below.`
          : 'The camera needs a secure (https) page. Open CrowdGrid over https, or type the code below.'
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
  const choosing = result?.result === 'CHOOSE';

  return (
    <div className="shell max-w-xl space-y-5 py-6" data-no-translate>
      <div className="cg-pagehead">
        <PageTitle kicker="Volunteer" tone="green" title="Pass scanner" lead="Point the camera at a QR. Green means let them in." />
      </div>

      <MyDutyCard />

      <div className="panel p-4">
        <p id="svc-label" className="field-label">Scanning at</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="svc-label">
          {SERVICES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={service === x.id}
              onClick={() => chooseService(x.id)}
              className={service === x.id ? 'btn-ink min-h-11 px-3' : 'btn-ghost min-h-11 px-3'}
            >
              {x.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-soft">For a pilgrim's personal QR, this decides which pass is used.</p>
      </div>

      {choosing && (
        <div role="status" aria-live="assertive" className="rounded-3xl bg-marigold-wash p-5">
          <p className="mb-1 inline-flex rounded-full bg-ink px-3 py-0.5 text-sm font-bold text-white">Personal QR · one QR for all passes</p>
          <p className="text-xl font-bold">{result.message}</p>
          {result.holder && <HolderId holder={result.holder} light />}
          <ul className="mt-3 space-y-2">
            {result.options.map((o) => (
              <li key={o._id}>
                <button type="button" className="btn-ink w-full justify-start text-left" onClick={() => check(result.qr, o._id)}>
                  {PASS_META[o.type]?.label}: {o.title}
                  {o.details?.location ? ` · ${o.details.location}` : ''}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && !choosing && (
        <div
          key={result.at}
          role="status"
          aria-live="assertive"
          className={`cg-verdict rounded-3xl p-6 text-white ${valid ? 'bg-tulsi' : 'bg-kumkum'}`}
        >
          {result.personal && (
            <p className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-0.5 text-sm font-bold">Personal QR · one QR for all passes</p>
          )}
          <div className="flex items-center gap-3">
            {valid ? <CircleCheck size={44} aria-hidden /> : <CircleX size={44} aria-hidden />}
            <div>
              <p className="text-2xl font-extrabold">{valid ? result.message : 'REJECTED'}</p>
              {!valid && <p className="text-lg font-semibold">{result.message}</p>}
            </div>
          </div>
          {(result.holder || result.pass?.holder) && <HolderId holder={result.holder || result.pass.holder} />}
          {result.pass && (
            <div className="mt-4 rounded-2xl bg-white/15 p-4">
              <p className="text-sm opacity-90">{PASS_META[result.pass.type]?.label}</p>
              <p className="text-xl font-bold">{result.pass.title}</p>
              {result.pass.subtitle && <p>{result.pass.subtitle}</p>}
              {result.pass.details?.people > 1 && (
                <p className="mt-2 text-2xl font-extrabold">
                  {result.pass.type === 'MEAL' ? `Serve ${result.pass.details.people} plates` : `Admit ${result.pass.details.people} people`}
                </p>
              )}
              {result.pass.details?.location && <p className="mt-2 text-2xl font-extrabold">{result.pass.details.location}</p>}
              {result.pass.details?.guests?.length > 0 && <p>Names: {result.pass.details.guests.join(', ')}</p>}
            </div>
          )}
          {import.meta.env.DEV && <p className="mt-3 text-sm opacity-90">Checked in {result.ms} ms</p>}
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
        <input id="manual" className="field font-mono text-base" placeholder="CG1.…" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} value={manual} onChange={(e) => setManual(e.target.value)} />
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

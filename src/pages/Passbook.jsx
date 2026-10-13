import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { errorMessage } from '../lib/api';
import { loadPasses, savePasses } from '../lib/passCache';
import { fmtDateTime } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import PassCard, { PASS_META } from '../components/PassCard';
import MyQrCard from '../components/MyQrCard';
import { useAuth } from '../lib/auth';

/**
 * My Yatra Passbook (FR-11). Loads passes from the API and caches them; with no
 * network it falls back to the cached copy so QR codes still show at the ghat.
 */
export default function Passbook() {
  const cached = useMemo(() => loadPasses(), []);
  const [passes, setPasses] = useState(cached?.passes || null);
  const [offlineSince, setOfflineSince] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showPast, setShowPast] = useState(false);
  const [now] = useState(() => Date.now());
  const [showEach, setShowEach] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    API.get('/passes/mine')
      .then(({ data }) => {
        setPasses(data);
        savePasses(data);
        setOfflineSince(null);
      })
      .catch((e) => {
        if (cached) setOfflineSince(cached.savedAt);
        else setError(errorMessage(e));
      });
  }, [cached]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!passes) return <Loading label="Opening your passbook" />;

  // Recompute state on the device too, so an offline pass shows "Expired" correctly
  const withState = passes.map((p) => {
    if (p.status !== 'ACTIVE') return p;
    if (new Date(p.validUntil).getTime() < now) return { ...p, state: 'EXPIRED' };
    if (new Date(p.validFrom).getTime() > now) return { ...p, state: 'UPCOMING' };
    return { ...p, state: 'ACTIVE' };
  });
  const usable = withState.filter((p) => p.state === 'ACTIVE' || p.state === 'UPCOMING');
  const past = withState.filter((p) => !(p.state === 'ACTIVE' || p.state === 'UPCOMING'));
  const types = [...new Set(usable.map((p) => p.type))];
  const shown = usable.filter((p) => filter === 'ALL' || p.type === filter);

  return (
    <div className="shell space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">My Yatra Passbook</h1>
        <p className="text-ink-soft">All your passes in one place. They stay on this phone, so they open even without network.</p>
      </div>
      {user && <MyQrCard name={user.name} activeCount={withState.filter((p) => p.state === 'ACTIVE').length} />}
      {offlineSince && <Notice>Showing passes saved on {fmtDateTime(offlineSince)}. You're offline, but these QR codes still work at the gate.</Notice>}

      {usable.length === 0 ? (
        <div className="panel p-8 text-center">
          <h2 className="text-xl font-bold">No active passes yet</h2>
          <p className="mt-1 text-ink-soft">Book a bed, claim a meal token or get a shuttle pass, and it appears here.</p>
          <Link to="/" className="btn-primary mt-5">Find a yatra</Link>
        </div>
      ) : (
        <>
          {types.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter passes">
              <button type="button" aria-pressed={filter === 'ALL'} className={filter === 'ALL' ? 'btn-ink' : 'btn-ghost'} onClick={() => setFilter('ALL')}>
                All ({usable.length})
              </button>
              {types.map((t) => (
                <button key={t} type="button" aria-pressed={filter === t} className={filter === t ? 'btn-ink' : 'btn-ghost'} onClick={() => setFilter(t)}>
                  {PASS_META[t]?.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Your passes</h2>
            <button type="button" className="btn-ghost min-h-10" aria-pressed={showEach} onClick={() => setShowEach(!showEach)}>
              {showEach ? 'Hide individual QR codes' : 'Show individual QR codes (backup)'}
            </button>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {shown.map((p) => <li key={p._id}><PassCard pass={p} expanded={showEach} /></li>)}
          </ul>
        </>
      )}

      {past.length > 0 && (
        <section>
          <button type="button" className="btn-ghost" aria-expanded={showPast} onClick={() => setShowPast(!showPast)}>
            {showPast ? 'Hide' : 'Show'} used and expired passes ({past.length})
          </button>
          {showPast && (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {past.map((p) => <li key={p._id}><PassCard pass={p} expanded={false} /></li>)}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

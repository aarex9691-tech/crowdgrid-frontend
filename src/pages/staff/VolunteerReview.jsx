import { useCallback, useEffect, useState } from 'react';
import API, { errorMessage } from '../../lib/api';
import { DOMAIN_LABELS, fmtDate } from '../../lib/format';
import Notice from '../../components/Notice';

/** Seva applications awaiting approval (NGO admins see only their own trust's). */
export default function VolunteerReview() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    API.get('/volunteer/applications', { params: { status: 'PENDING' } })
      .then(({ data }) => setApps(data))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, decision) => {
    setBusy(id);
    setError('');
    try {
      await API.post(`/volunteer/applications/${id}/review`, { decision });
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="vol-review" className="space-y-3">
      <h2 id="vol-review" className="text-2xl font-bold">Seva applications</h2>
      <Notice tone="error">{error}</Notice>
      {apps.length === 0 ? (
        <Notice>No applications waiting for review.</Notice>
      ) : (
        <ul className="space-y-3">
          {apps.map((a) => (
            <li key={a._id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-lg font-bold">{a.userId?.name}</p>
                <p className="text-ink-soft">
                  {DOMAIN_LABELS[a.domain]}
                  {a.sector ? ` · ${a.sector}` : ''}
                  {a.providerId?.name ? ` · ${a.providerId.name}` : ''}
                </p>
                {a.dates?.length > 0 && <p className="text-[15px]">Days: {a.dates.map((d) => fmtDate(d, { year: undefined })).join(', ')}</p>}
                {a.note && <p className="text-[15px] text-ink-soft">"{a.note}"</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ink" disabled={busy === a._id} onClick={() => decide(a._id, 'APPROVED')}>Approve</button>
                <button type="button" className="btn-ghost" disabled={busy === a._id} onClick={() => decide(a._id, 'REJECTED')}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

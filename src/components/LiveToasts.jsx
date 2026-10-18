import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Siren, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useLive } from '../lib/realtime';

const SOS_TYPE = { MEDICAL: 'Medical', LOST: 'Lost person', CROWD: 'Crowd', FIRE: 'Fire', GENERAL: 'General' };
const STATUS_TEXT = {
  ACKNOWLEDGED: 'The control room has seen your SOS. Help is on the way, stay where you are if it is safe.',
  RESOLVED: 'Your SOS has been marked resolved. Raise a new one if you still need help.',
};

/**
 * Pop-up notices driven by live updates:
 *   control room (super admin, authority): a new SOS has been raised
 *   pilgrim: their own SOS was acknowledged / resolved
 */
export default function LiveToasts() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const isControl = user && ['SUPER_ADMIN', 'AUTHORITY'].includes(user.role);

  const push = (t) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), t.tone === 'alert' ? 15000 : 9000);
  };

  useLive(
    'sos',
    (p) => {
      if (isControl && p?.action === 'raised') {
        push({ tone: 'alert', title: `New ${SOS_TYPE[p.type] || ''} SOS alert`.replace('  ', ' '), body: 'A pilgrim needs help. Open the control room to assign a volunteer.', to: '/control' });
      } else if (user?.role === 'USER' && p?.action === 'updated' && STATUS_TEXT[p.status]) {
        push({ tone: 'ok', title: p.status === 'ACKNOWLEDGED' ? 'Help is on the way' : 'SOS resolved', body: STATUS_TEXT[p.status] });
      }
    },
    { wait: 50, enabled: !!user }
  );

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-4 top-[calc(var(--header-h,4rem)+0.75rem)] z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-96" aria-live="assertive" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex w-full gap-3 rounded-2xl border-2 bg-white p-4 shadow-xl ${t.tone === 'alert' ? 'border-kumkum' : 'border-tulsi'}`}>
          <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${t.tone === 'alert' ? 'animate-pulse bg-kumkum text-white' : 'bg-tulsi-wash text-tulsi'}`}>
            {t.tone === 'alert' ? <Siren size={20} aria-hidden /> : <CheckCircle2 size={20} aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{t.title}</p>
            <p className="text-sm text-ink-soft">{t.body}</p>
            {t.to && <Link to={t.to} className="mt-1 inline-block text-sm font-bold text-kumkum underline">Open control room</Link>}
          </div>
          <button type="button" className="h-8 w-8 flex-none rounded-lg text-ink-soft hover:bg-mist" onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss">
            <X size={16} className="mx-auto" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, BusFront, HandHeart, Siren, UtensilsCrossed } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDate } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import LodgingTab from './hub/LodgingTab';
import FoodTab from './hub/FoodTab';
import TransitTab from './hub/TransitTab';
import SevaTab from './hub/SevaTab';
import SosTab from './hub/SosTab';

const TABS = [
  { id: 'lodging', label: 'Lodging & camps', icon: BedDouble, Component: LodgingTab },
  { id: 'food', label: 'Food & annadanam', icon: UtensilsCrossed, Component: FoodTab },
  { id: 'transit', label: 'Transit & shuttles', icon: BusFront, Component: TransitTab },
  { id: 'seva', label: 'Seva & volunteering', icon: HandHeart, Component: SevaTab },
  { id: 'sos', label: 'Emergency SOS', icon: Siren, Component: SosTab },
];

export default function Hub() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const active = TABS.find((t) => t.id === params.get('tab')) || TABS[0];

  useEffect(() => {
    API.get(`/events/${slug}`)
      .then(({ data }) => setEvent(data))
      .catch((e) => setError(errorMessage(e)));
  }, [slug]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!event) return <Loading label="Opening yatra portal" />;

  return (
    <div>
      <div className="bg-ink text-white">
        <div className="shell py-5">
          <Link to="/" className="text-sm text-[#c9d6ee] hover:text-white">All yatras</Link>
          <h1 className="font-display text-3xl">{event.title}</h1>
          <p className="text-[#c9d6ee]">
            {event.tagline} · {fmtDate(event.startDate)} to {fmtDate(event.endDate)}
          </p>
        </div>
      </div>

      {/* Service ribbon: switches tabs without a page reload (FR-03) */}
      <nav aria-label="Yatra services" className="sticky top-[var(--header-h,4rem)] z-20 border-b border-line bg-white">
        <div className="shell flex gap-1 overflow-x-auto py-2" role="tablist">
          {TABS.map((t) => {
            const selected = t.id === active.id;
            const sos = t.id === 'sos';
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setParams({ tab: t.id }, { replace: true })}
                className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 font-semibold transition-colors ${
                  selected ? (sos ? 'bg-kumkum text-white' : 'bg-ink text-white') : sos ? 'text-kumkum hover:bg-kumkum-wash' : 'text-ink-soft hover:bg-mist hover:text-ink'
                }`}
              >
                <t.icon size={20} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
      {!canBook(user) && (
        <div className="shell pt-4">
          <Notice>
            Staff view ({ROLE_LABELS[user.role]}): you can see live availability here. Booking is only for pilgrims.{' '}
            <Link className="font-bold underline" to={homeFor(user.role)}>Go to your dashboard</Link>
          </Notice>
        </div>
      )}

      <div className="shell py-6" role="tabpanel">
        <active.Component event={event} />
      </div>
    </div>
  );
}

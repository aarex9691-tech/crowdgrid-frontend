import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, BusFront, Footprints, HandHeart, Info, Siren, UtensilsCrossed } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDate } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import LodgingTab from './hub/LodgingTab';
import FoodTab from './hub/FoodTab';
import TransitTab from './hub/TransitTab';
import SevaTab from './hub/SevaTab';
import SosTab from './hub/SosTab';
import SnanDates from '../components/SnanDates';
import YatraGuide from '../components/YatraGuide';

// The walking map (Leaflet) only loads when the tab is opened
const RouteTab = lazy(() => import('./hub/RouteTab'));
const ROUTE_EVENT = 'simhastha-kumbh-2027'; // walking lanes are mapped for Nashik so far

// `hint` is one line telling a first-time visitor what the tab is for
const TABS = [
  { id: 'lodging', label: 'Lodging & camps', icon: BedDouble, Component: LodgingTab, hint: 'Book a bed in a verified dharamshala or tent camp. Free camps are marked, and your stay QR is ready right away.' },
  { id: 'food', label: 'Food', icon: UtensilsCrossed, Component: FoodTab, hint: 'Get a free meal token for you and up to 4 family members. Show the QR at the kitchen counter.' },
  { id: 'transit', label: 'Transport', icon: BusFront, Component: TransitTab, hint: 'Shuttles and buses between parking, stations and the ghats. One bus pass can cover up to 5 people.' },
  { id: 'route', label: 'Walk to ghat', icon: Footprints, Component: RouteTab, only: ROUTE_EVENT, hint: 'Pick where you are and a ghat. We show the least crowded walking route, updated live by the control room.' },
  { id: 'seva', label: 'Seva', icon: HandHeart, Component: SevaTab, hint: 'Volunteer for crowd guidance, first aid or annadanam. Approved volunteers get a volunteer ID QR.' },
  { id: 'sos', label: 'Emergency SOS', icon: Siren, Component: SosTab, hint: 'Ask for help in one tap, or report a missing or found person. In danger, call 112 first.' },
];

export default function Hub() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/events/${slug}`)
      .then(({ data }) => setEvent(data))
      .catch((e) => setError(errorMessage(e)));
  }, [slug]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!event) return <Loading label="Opening yatra portal" />;
  const tabs = TABS.filter((t) => !t.only || t.only === event.slug);
  const active = tabs.find((t) => t.id === params.get('tab')) || tabs[0];

  return (
    <div>
      <div className="bg-ink text-white">
        <div className="shell py-5">
          <Link to="/" className="text-sm text-[#c9d6ee] hover:text-white">All yatras</Link>
          <h1 className="font-display text-3xl">{event.title}</h1>
          <p className="text-[#c9d6ee]">
            {event.tagline} · {fmtDate(event.startDate)} to {fmtDate(event.endDate)}
          </p>
          <SnanDates event={event} all />
        </div>
      </div>

      {/* Service ribbon: switches tabs without a page reload (FR-03) */}
      <nav aria-label="Yatra services" className="sticky top-[var(--header-h,4rem)] z-20 border-b border-line bg-white">
        <div className="shell flex gap-1 overflow-x-auto py-2" role="tablist">
          {tabs.map((t) => {
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

      <div className="shell space-y-4 py-6" role="tabpanel">
        <YatraGuide event={event} />
        {active.hint && (
          <p className="flex items-start gap-2 text-ink-soft" data-testid="tab-hint">
            <Info size={18} className="mt-1 shrink-0 text-ink-faint" aria-hidden />
            {active.hint}
          </p>
        )}
        <Suspense fallback={<Loading label="Loading" />}>
          <active.Component event={event} />
        </Suspense>
      </div>
    </div>
  );
}

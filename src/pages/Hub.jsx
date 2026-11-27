import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, BusFront, CalendarHeart, Footprints, HandHeart, Info, Siren, Users, UtensilsCrossed } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { fmtDate } from '../lib/format';
import PrebookNotice from '../components/PrebookNotice';
import Notice, { Loading } from '../components/Notice';
import { canBook, homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import LodgingTab from './hub/LodgingTab';
import FoodTab from './hub/FoodTab';
import TransitTab from './hub/TransitTab';
import SevaTab from './hub/SevaTab';
import ProgrammesTab from './hub/ProgrammesTab';
import SosTab from './hub/SosTab';
import SnanDates from '../components/SnanDates';
import YatraGuide from '../components/YatraGuide';
import { useT } from '../lib/i18n';
import PageHero from '../components/PageHero';
import { DEFAULT_EVENTS } from '../data/defaultEvents';

// The walking map (Leaflet) only loads when the tab is opened
const RouteTab = lazy(() => import('./hub/RouteTab'));
const ROUTE_EVENT = 'simhastha-kumbh-2027'; // walking lanes are mapped for Nashik so far

// Label and one-line hint for each tab come from the language file (lib/i18n.jsx): tab.<id>, hint.<id>
const TABS = [
  { id: 'lodging', icon: BedDouble, Component: LodgingTab },
  { id: 'food', icon: UtensilsCrossed, Component: FoodTab },
  { id: 'transit', icon: BusFront, Component: TransitTab },
  { id: 'route', icon: Footprints, Component: RouteTab, only: ROUTE_EVENT },
  { id: 'programmes', icon: CalendarHeart, Component: ProgrammesTab }, // approved by the District Control Room
  { id: 'seva', icon: HandHeart, Component: SevaTab },
  { id: 'sos', icon: Siren, Component: SosTab },
];

export default function Hub() {
  const { user } = useAuth();
  const t = useT();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const defaultMatch =
    DEFAULT_EVENTS.find((e) => e.slug === slug || e._id === slug) ||
    DEFAULT_EVENTS.find((e) => e.kind === 'YATRA' && (e.slug.includes(slug) || (slug && slug.includes(e.slug)))) ||
    DEFAULT_EVENTS.find((e) => e.kind === 'YATRA') ||
    null;
  const [event, setEvent] = useState(defaultMatch);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/events/${slug}`)
      .then(({ data }) => {
        if (data) {
          setEvent(data);
          setError('');
        }
      })
      .catch((e) => {
        if (!defaultMatch) {
          setError(errorMessage(e));
        }
      });
  }, [slug]);

  if (error && !event) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!event) return <Loading label="Opening yatra portal" />;
  const tabs = TABS.filter((x) => !x.only || x.only === event.slug);
  const active = tabs.find((x) => x.id === params.get('tab')) || tabs[0];

  const isYatra = event.kind === 'YATRA' || event.slug?.includes('kumbh') || event.slug?.includes('wari') || event.slug?.includes('rath');

  return (
    <div className={isYatra ? 'cg-yatra-theme' : ''}>
      <PageHero
        kind="pilgrimage"
        back={{ to: '/events?tab=yatras', label: t('hub.allYatras') }}
        title={event.title}
        lead={event.tagline}
      >
        <p className="mt-1 text-blue-mist">{fmtDate(event.startDate)} to {fmtDate(event.endDate)}</p>
        {event.registered > 0 && (
          <p className="mt-1 flex items-center gap-2 font-semibold text-saffron-light">
            <Users size={18} aria-hidden /> {event.registered.toLocaleString('en-IN')} {event.registered === 1 ? 'pilgrim' : 'pilgrims'} registered
          </p>
        )}
        <SnanDates event={event} all />
      </PageHero>

      {/* Service ribbon: switches tabs without a page reload (FR-03) */}
      {/* Phones: all six services in a 3 x 2 grid, so SOS is never scrolled out of sight; it does not
          stick, so it does not cover the page. Wider screens: one sticky row. */}
      <nav aria-label={t('hub.services')} className="z-20 border-b border-line bg-white shadow-2xs sm:sticky sm:top-[var(--header-h,4rem)]">
        <div className="shell no-scrollbar grid grid-cols-3 gap-x-1 sm:flex sm:gap-1 sm:overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            const sos = tab.id === 'sos';
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setParams({ tab: tab.id }, { replace: true })}
                className={`flex min-h-14 sm:min-h-16 shrink-0 flex-col items-center justify-center gap-1 border-b-[3.5px] px-1 text-[15px] whitespace-nowrap sm:flex-auto sm:flex-row sm:gap-2 sm:px-3 sm:text-base xl:text-[17px] font-bold transition-all ${
                  selected
                    ? (sos ? 'border-kumkum text-kumkum bg-kumkum-wash/40' : 'border-marigold text-ink bg-marigold-wash/30')
                    : (sos ? 'border-transparent text-kumkum hover:border-kumkum/40 hover:bg-kumkum-wash/20' : 'border-transparent text-ink-soft hover:text-ink hover:bg-mist')
                }`}
              >
                <tab.icon size={20} className="shrink-0" aria-hidden />
                {t(`tab.${tab.id}`)}
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

      <div className="shell space-y-6 py-8" role="tabpanel">
        {canBook(user) && <PrebookNotice event={event} />}
        <YatraGuide event={event} />
        <p className="flex items-start gap-3 rounded-2xl border border-line bg-mist/70 p-4 sm:p-5 text-base sm:text-lg text-ink-soft" data-testid="tab-hint">
          <Info size={22} className="mt-0.5 shrink-0 text-blue" aria-hidden />
          <span>{t(`hint.${active.id}`)}</span>
        </p>
        <div className="pt-2">
          <Suspense fallback={<Loading label="Loading" />}>
            <active.Component event={event} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

import PeopleStepper from '../components/PeopleStepper';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Phone, ShieldCheck, Ticket, Users } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { canBook, useAuth } from '../lib/auth';
import { rupees, useCart } from '../lib/cart';
import { EVENT_CATEGORIES, fmtDate, fmtTime, googleMapsUrl } from '../lib/format';
import Notice, { Loading } from '../components/Notice';
import { cachePass } from '../lib/passCache';
import { addTicketToCart, placesLeft } from '../components/EventCards';
import { MAX_PER_ACCOUNT } from '../lib/limits';

/** Everything about one paid public event, with Register (cart) and the map. */
export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [freeMsg, setFreeMsg] = useState(null);
  const [people, setPeople] = useState(1);
  const [mine, setMine] = useState(null); // { held, left } tickets this account already has

  const loadMine = (id) =>
    API.get(`/events/${id}/my-tickets`).then(({ data }) => setMine(data)).catch(() => setMine(null));

  useEffect(() => {
    API.get(`/events/${slug}`)
      .then(({ data }) => {
        setEvent(data);
        if (user && data.kind === 'PUBLIC') loadMine(data._id);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [slug, user]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!event) return <Loading label="Loading event" />;
  if (event.kind !== 'PUBLIC') return <div className="shell py-10"><Notice>This event is not open to the public.</Notice></div>;

  const placesOpen = placesLeft(event);
  // the cart holds one line per event; adding again replaces it, so it does not reduce what is left
  const inCart = (cart.items || []).find((i) => i.key === `EVENT:${event._id}`)?.input?.people || 0;
  const accountLeft = mine ? mine.left : MAX_PER_ACCOUNT;
  const left = Math.min(placesOpen, accountLeft);
  const over = new Date(event.endDate) < new Date();
  const loc = event.location;
  const bbox = loc ? `${loc.lng - 0.006},${loc.lat - 0.004},${loc.lng + 0.006},${loc.lat + 0.004}` : null;

  const free = !(event.ticketPrice > 0);
  const register = async () => {
    if (!user) return navigate('/login', { state: { from: `/event/${slug}` } });
    if (free) {
      try {
        const { data } = await API.post(`/events/${event._id}/register`, { people: Math.min(people, left) });
        cachePass(data.pass);
        setFreeMsg({ tone: 'success', text: `${data.message} Your entry pass is in your passbook.` });
        setEvent((e) => ({ ...e, attendeesCount: data.attendeesCount }));
        setPeople(1);
        loadMine(event._id);
      } catch (e) {
        setFreeMsg({ tone: 'error', text: errorMessage(e) });
      }
      return;
    }
    addTicketToCart(cart, event, Math.min(people, left));
    setAdded(true);
  };

  return (
    <div className="pb-6">
      <section className="cg-band">
        <div className="toran" aria-hidden />
        <div className="shell py-8">
          <Link to="/events?tab=public" className="inline-flex items-center gap-1 text-sm text-[#c9d6ee] hover:text-white">
            <ArrowLeft size={16} aria-hidden /> All public events
          </Link>
          <p className="mt-3 cg-kicker text-[#FFD9B8]">{EVENT_CATEGORIES[event.category] || 'Public event'}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{event.title}</h1>
          <p className="mt-1 text-[#c9d6ee]">Hosted by {event.hostName || 'CrowdGrid'}</p>
        </div>
      </section>

      <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-xl font-bold">About this event</h2>
            <p className="mt-2 whitespace-pre-line text-ink-soft">{event.description}</p>
          </section>

          <section className="panel space-y-3 p-5" aria-label="Details">
            <p className="flex items-start gap-3">
              <CalendarDays size={22} className="mt-0.5 shrink-0 text-kumkum" aria-hidden />
              <span>
                <b>{fmtDate(event.startDate, { weekday: 'long' })}</b>
                <span className="block text-ink-soft">{fmtTime(event.startDate)} to {fmtTime(event.endDate)} (IST)</span>
              </span>
            </p>
            <p className="flex items-start gap-3">
              <MapPin size={22} className="mt-0.5 shrink-0 text-kumkum" aria-hidden />
              <span>
                <b>{event.venue}</b>
                <span className="block text-ink-soft">{[event.address, (event.address || '').toLowerCase().includes((event.city || '').toLowerCase()) ? null : event.city, event.pincode].filter(Boolean).join(', ')}</span>
              </span>
            </p>
            {event.minAge > 0 && (
              <p className="flex items-start gap-3">
                <ShieldCheck size={22} className="mt-0.5 shrink-0 text-kumkum" aria-hidden /> Age {event.minAge}+ only
              </p>
            )}
            {event.contactPhone && (
              <p className="flex items-start gap-3">
                <Phone size={22} className="mt-0.5 shrink-0 text-kumkum" aria-hidden />
                <a className="font-semibold underline" href={`tel:+91${event.contactPhone}`}>+91 {event.contactPhone}</a>
              </p>
            )}
          </section>

          <section className="panel overflow-hidden" aria-label="Map">
            {bbox ? (
              <iframe
                title={`Map of ${event.venue}`}
                className="h-64 w-full border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat},${loc.lng}`}
              />
            ) : (
              <div className="flex h-32 items-center justify-center bg-mist text-ink-soft">No map pin for this venue</div>
            )}
            <a className="flex items-center justify-center gap-2 p-3 font-semibold underline" href={googleMapsUrl(loc, `${event.venue}, ${event.city}`)} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden /> Open in Google Maps
            </a>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel space-y-4 p-5">
            {free ? (
              <p className="text-3xl font-extrabold text-tulsi">Free entry</p>
            ) : (
              <p className="text-3xl font-extrabold">{rupees(event.ticketPrice)}<span className="text-base font-normal text-ink-soft"> per person</span></p>
            )}
            {freeMsg && <Notice tone={freeMsg.tone}>{freeMsg.text}</Notice>}
            <p className="flex items-center gap-2 text-ink-soft">
              <Users size={18} aria-hidden /> {over ? 'This event is over' : placesOpen === 0 ? 'Sold out' : `${placesOpen} of ${event.capacity} places left`}
            </p>
            {added && (
              <Notice tone="success">
                {people > 1 ? `${people} tickets added.` : 'Ticket added.'} <Link to="/checkout" className="font-bold underline">Go to checkout</Link>
              </Notice>
            )}
            {canBook(user) && (mine?.held > 0 || inCart > 0) && (
              <p className="rounded-xl bg-tulsi-wash p-3 text-sm" data-testid="my-tickets">
                {mine?.held > 0 ? (
                  <>
                    You have booked <b>{mine.held}</b> {mine.held === 1 ? 'ticket' : 'tickets'} for this event.{' '}
                    {accountLeft > 0 ? `You can book ${accountLeft} more.` : `That is the most one account can book (${MAX_PER_ACCOUNT}).`}
                  </>
                ) : null}
                {inCart > 0 && (
                  <>
                    {mine?.held > 0 ? ' ' : ''}<b>{inCart}</b> {inCart === 1 ? 'ticket is' : 'tickets are'} in your cart. Change the number below and add again to update it.
                  </>
                )}
              </p>
            )}
            {canBook(user) ? (
              <>
                {!over && left > 0 && (
                  <PeopleStepper id="ev-people" label="Tickets" value={Math.min(people, left)} max={left} onChange={setPeople} hint={`Up to ${MAX_PER_ACCOUNT} tickets per account. You can book them together or in more than one go.`} />
                )}
                <button type="button" className="btn-primary w-full text-lg" disabled={over || left === 0} onClick={register}>
                  <Ticket size={20} aria-hidden /> Register · {free ? 'Free' : rupees(event.ticketPrice * Math.min(people, Math.max(left, 1)))}
                </button>
              </>
            ) : (
              <p className="rounded-xl bg-mist p-3 text-sm text-ink-soft">You are signed in as staff. Registration is for pilgrims and visitors.</p>
            )}
            <p className="text-sm text-ink-soft">{free ? 'Confirmed instantly, no payment needed.' : 'Pay by UPI or card at checkout.'} Your entry pass QR appears in your passbook.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

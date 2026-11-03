import { Link } from 'react-router-dom';
import {
  BedDouble, BusFront, ChevronDown, Compass, HandHeart, Landmark, LifeBuoy, Mail, MessageCircle, Phone, QrCode, ScanLine, ShieldCheck, Siren, Tent, Ticket, UtensilsCrossed, Users,
} from 'lucide-react';
import { SITE } from '../lib/site';
import { MAX_PER_ACCOUNT } from '../lib/limits';
import { openTour } from '../components/GuidedTour';

const flag = `/yatra/${SITE.flagshipSlug}`;

const START = [
  { icon: Users, title: 'Create a free account', text: 'Sign up with your mobile number. It takes under a minute.', to: '/register', cta: 'Create account' },
  { icon: Compass, title: 'Open your yatra', text: 'Pick Simhastha Kumbh, Pandharpur Wari or Jagannath Rath Yatra.', to: '/events', cta: 'See yatras' },
  { icon: BedDouble, title: 'Book what you need', text: 'Stay, meal tokens and bus passes, for up to 5 people.', to: flag, cta: 'Book now' },
  { icon: QrCode, title: 'Show one QR', text: 'Everything is in My Passbook. One QR works at every counter.', to: '/passbook', cta: 'My Passbook' },
];

const GUIDES = [
  {
    id: 'pilgrims',
    icon: Users,
    title: 'Pilgrims and families',
    steps: [
      [BedDouble, 'Stay', 'Open the yatra page, then Lodging & camps. Filter by sector or free camps, choose the number of beds and dates, and confirm. Paid stays go to the cart.'],
      [UtensilsCrossed, 'Food', 'In the Food tab, pick a kitchen, day and meal. One free token covers you and up to 4 family members.'],
      [BusFront, 'Transport', 'In the Transport tab, choose a shuttle or bus and the number of people. Free shuttles give a pass right away.'],
      [Ticket, 'Events', 'Aartis, kirtans and heritage walks are on the Events page. Book up to 5 tickets, in one go or more.'],
      [QrCode, 'At the counter', 'Open My Passbook and show "My QR". Staff scan it and see what you booked for that counter.'],
    ],
  },
  {
    id: 'seva',
    icon: Tent,
    title: 'Seva groups, NGOs and trusts',
    steps: [
      [ShieldCheck, 'Get verified', 'Register your organisation. The authority checks your registration number before your camps and kitchens go live.'],
      [Tent, 'List camps and kitchens', 'From My camps, add dharamshalas, tent camps and kitchens with beds, meals and timings.'],
      [ScanLine, 'Check people in', 'Use the Scanner at your gate or counter. A pass from another camp is refused automatically.'],
    ],
  },
  {
    id: 'volunteers',
    icon: HandHeart,
    title: 'Volunteers',
    steps: [
      [HandHeart, 'Apply for seva', 'Open the Seva tab on a yatra page and choose a role: crowd guidance, first aid or annadanam.'],
      [QrCode, 'Your volunteer ID', 'Once approved, your volunteer ID QR is in My Passbook.'],
      [Siren, 'Respond to SOS', 'Nearby help requests appear for you. Mark them as on the way and resolved.'],
    ],
  },
  {
    id: 'authorities',
    icon: Landmark,
    title: 'Authorities and event hosts',
    steps: [
      [ShieldCheck, 'Control room', 'See live SOS requests, camp occupancy and walking lanes. Mark lanes busy or closed and pilgrim routes update.'],
      [Ticket, 'Host events', 'Create public events with tickets and capacity. Check-in numbers update live.'],
      [Users, 'Campus and corporate', 'Invite-only events use an access code. Guests get a badge QR for sessions and meals.'],
    ],
  },
];

const FAQ = [
  ['Is CrowdGrid free for pilgrims?', 'Yes. Creating an account, free camps, meal tokens and free shuttles cost nothing. Some stays, buses and events charge a fee, which is always shown before you pay.'],
  ['How many people can I book for?', `One account can book for up to ${MAX_PER_ACCOUNT} people: ${MAX_PER_ACCOUNT} beds per yatra, a meal token for ${MAX_PER_ACCOUNT}, a bus pass for ${MAX_PER_ACCOUNT} and ${MAX_PER_ACCOUNT} tickets per event.`],
  ['What if my phone has no network at the mela?', 'Passes you have opened once are saved on your phone and the QR still shows offline. You can also take a screenshot or print it.'],
  ['What if I lose my phone?', 'Log in from any phone with your mobile number and password. All your passes are in My Passbook. Staff can also find your booking by your mobile number.'],
  ['Are the camps and kitchens safe?', 'Every camp, kitchen and seva group is verified by the authority before it appears. Unverified listings are never shown to pilgrims.'],
  ['Someone from my family is missing. What do I do?', 'Open Emergency SOS on the yatra page and choose "Report a missing person". Add a photo and what they are wearing. Volunteers and the control room see it at once. Also go to the nearest help booth.'],
  ['Can I cancel a booking?', 'Yes. Open My Passbook and tap "Cancel" on the stay, meal token, bus pass or ticket, any time before it starts. For paid bookings you get 100% back up to 48 hours before, 50% up to 24 hours before, and no refund after that. The pop-up shows your exact refund before you confirm.'],
];

/** Help: a first-time guide to the site, step by step guides by role, and FAQs. */
export default function Help() {
  const tel = `tel:${SITE.phone.replace(/[^\d+]/g, '')}`;
  return (
    <div className="pb-10">
      <section className="bg-ink text-white">
        <div className="toran" aria-hidden />
        <div className="shell flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-marigold">Help centre</p>
            <h1 className="mt-1 font-display text-4xl">New to {SITE.name}? Start here</h1>
            <p className="mt-3 text-lg text-[#d5deed]">
              Everything you need for your yatra in one place: where to stay, what to eat, how to travel and how to get help. Here is how it works.
            </p>
          </div>
          <button type="button" className="btn-primary self-start md:self-auto" onClick={openTour}>
            <Compass size={20} aria-hidden /> Take the 1-minute tour
          </button>
        </div>
      </section>

      <div className="shell space-y-12 py-10">
        <section aria-labelledby="start-title">
          <h2 id="start-title" className="text-2xl font-bold">Getting started in 4 steps</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {START.map((s, i) => (
              <li key={s.title} className="panel flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-terracotta text-sm font-bold text-white">{i + 1}</span>
                  <s.icon size={22} className="text-marigold-deep" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-1 flex-1 text-ink-soft">{s.text}</p>
                <Link to={s.to} className="mt-3 font-semibold text-terracotta underline-offset-4 hover:underline">{s.cta} →</Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="guides-title">
          <h2 id="guides-title" className="text-2xl font-bold">Guides for everyone</h2>
          <p className="mt-1 text-ink-soft">Choose who you are to see what you can do.</p>
          <nav aria-label="Guides" className="mt-4 flex flex-wrap gap-2">
            {GUIDES.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="pill border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink-faint">
                {g.title}
              </a>
            ))}
          </nav>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {GUIDES.map((g) => (
              <article key={g.id} id={g.id} className="panel scroll-mt-28 p-6">
                <h3 className="flex items-center gap-3 text-xl font-bold">
                  <span className="grid size-10 place-items-center rounded-xl bg-marigold-wash text-marigold-deep"><g.icon size={22} aria-hidden /></span>
                  {g.title}
                </h3>
                <ul className="mt-4 space-y-4">
                  {g.steps.map(([Icon, title, text]) => (
                    <li key={title} className="flex gap-3">
                      <Icon size={20} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
                      <p><span className="font-semibold">{title}. </span><span className="text-ink-soft">{text}</span></p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-title" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 id="faq-title" className="text-2xl font-bold">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-semibold hover:bg-mist">
                    <span className="flex-1">{q}</span>
                    <ChevronDown size={20} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="px-5 pb-4 text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="space-y-4">
            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold"><LifeBuoy size={20} aria-hidden /> Still need help?</h2>
              <p className="mt-1 text-ink-soft">Our customer care team replies within a day.</p>
              <ul className="mt-3 space-y-2">
                <li><a className="flex items-center gap-2 font-semibold underline" href={`mailto:${SITE.email}`}><Mail size={18} aria-hidden /> {SITE.email}</a></li>
                <li><a className="flex items-center gap-2 font-semibold underline" href={tel}><Phone size={18} aria-hidden /> {SITE.phone}</a></li>
                <li><a className="flex items-center gap-2 font-semibold underline" href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden /> WhatsApp</a></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-kumkum-wash p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-kumkum"><Siren size={20} aria-hidden /> In an emergency</h2>
              <p className="mt-1">Call <a className="font-bold text-kumkum" href="tel:112">112</a>, medical <a className="font-bold text-kumkum" href="tel:108">108</a> or child helpline <a className="font-bold text-kumkum" href="tel:1098">1098</a>, or use the <Link className="font-bold underline" to={`${flag}?tab=sos`}>SOS button</Link>.</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

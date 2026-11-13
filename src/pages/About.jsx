import { Link } from 'react-router-dom';
import {
  Activity, BedDouble, BusFront, Building2, Footprints, HandHeart, Landmark, Lock, Mail, MessageCircle, Phone, QrCode, ShieldCheck, Siren, Tent, Ticket, UserSearch, Users, UtensilsCrossed, WifiOff,
} from 'lucide-react';
import { SITE } from '../lib/site';
import PageHero from '../components/PageHero';
import CraftsOfIndia from '../components/heritage/CraftsOfIndia';

const CHALLENGES = [
  { icon: Users, title: 'Crowds bigger than cities', text: 'One festival day can draw more people than most cities hold. Narrow lanes turn unsafe fast.' },
  { icon: Tent, title: 'Unverified stays and sellers', text: 'First-time visitors cannot tell who runs a stay or a ticket counter.' },
  { icon: UserSearch, title: 'People lost in the crowd', text: 'Elders and children get separated, and help desks still run on paper.' },
];

const SERVICES = [
  { icon: BedDouble, title: 'Verified stays', text: 'Dharamshalas and tent camps run by verified trusts, with live bed availability.' },
  { icon: UtensilsCrossed, title: 'Meal tokens', text: 'Free annadanam tokens for a family, with timed slots so queues stay short.' },
  { icon: BusFront, title: 'Shuttles and buses', text: 'Passes for shuttles between parking, stations and the ghats.' },
  { icon: Footprints, title: 'Safest walking route', text: 'The least crowded path, rerouted live when a lane fills.' },
  { icon: Siren, title: 'Emergency SOS', text: 'One-tap help with location, and a missing and found persons bulletin.' },
  { icon: HandHeart, title: 'Seva', text: 'Volunteer sign-up for crowd guidance, first aid and annadanam.' },
  { icon: Ticket, title: 'Events', text: 'Concerts, aartis, walks and invite-only campus or corporate events.' },
  { icon: Activity, title: 'Live control room', text: 'Authorities see SOS, occupancy and crowding on one screen, as it happens.' },
];

const AUDIENCES = [
  { icon: Users, title: 'Attendees and families', text: 'Plan the whole trip from one phone, for up to 5 people.' },
  { icon: Tent, title: 'Trusts, NGOs and seva groups', text: 'List camps and kitchens, manage beds and meals, check people in.' },
  { icon: HandHeart, title: 'Volunteers', text: 'Get a seva role, a volunteer ID and nearby help requests.' },
  { icon: Landmark, title: 'Authorities', text: 'Verify providers, manage lanes and respond to emergencies with live data.' },
  { icon: Building2, title: 'Campus and corporate hosts', text: 'Run invite-only events with access codes and badge check-in.' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Every provider is verified', text: 'Camps, kitchens and seva groups appear only after the authority checks their registration.' },
  { icon: QrCode, title: 'One QR, used once', text: 'Each pass is signed and can be redeemed only once, so tickets cannot be copied or resold.' },
  { icon: Lock, title: 'Privacy by default', text: 'Phone numbers in missing-person reports are never shown publicly. Staff see only what their counter needs.' },
  { icon: WifiOff, title: 'Works on weak networks', text: 'Passes stay on the phone and show offline. Pages are light enough for basic smartphones.' },
];

/** About us: what CrowdGrid is, the problem it solves, who it serves, and customer care. */
export default function About() {
  const tel = `tel:${SITE.phone.replace(/[^\d+]/g, '')}`;
  return (
    <div className="pb-10">
      <PageHero
        kind="all"
        title="One app for every crowd"
        lead="Passes, stays, food, transport and SOS for pilgrimages, public events and company gatherings. We start with Simhastha Kumbh 2026–28 at Nashik."
      />

      {/* Four figures, set as a ruled row rather than boxes */}
      <dl className="shell grid grid-cols-2 gap-y-6 border-b border-line py-8 sm:grid-cols-4">
        {[
          ['3', 'kinds of gathering'],
          ['5 crore+', 'expected at Simhastha'],
          ['1 QR', 'for every service'],
          ['24×7', 'SOS and live control room'],
        ].map(([n, l]) => (
          <div key={l} className="border-l-[3px] border-marigold pl-4">
            <dt className="sr-only">{l}</dt>
            <dd className="font-display text-3xl sm:text-4xl">{n}</dd>
            <dd className="text-sm text-ink-soft">{l}</dd>
          </div>
        ))}
      </dl>

      <div className="shell space-y-14 py-12">
        <section aria-labelledby="mission-title" className="grid gap-8 lg:grid-cols-[0.9fr_2fr]">
          <div>
            <h2 id="mission-title" className="text-2xl font-bold sm:text-3xl">Our mission</h2>
            <p className="mt-3 max-w-prose text-lg text-ink-soft">
              Everyone in a crowd should find a bed, a meal and a way home, and get help within minutes. We put the people who make
              that happen on one live system.
            </p>
          </div>
          <div>
            <h3 className="font-bold">The challenge</h3>
            <ul className="mt-3 grid gap-4 sm:grid-cols-3">
              {CHALLENGES.map((c) => (
                <li key={c.title} className="border-t-[3px] border-line pt-4">
                  <c.icon size={24} className="text-blue" aria-hidden />
                  <p className="mt-3 font-bold">{c.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="offer-title">
          <h2 id="offer-title" className="text-2xl font-bold sm:text-3xl">What we offer</h2>
          <p className="mt-1 text-ink-soft">Every service, in one place.</p>
          <ul className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <li key={s.title} className="flex gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-wash text-blue"><s.icon size={22} aria-hidden /></span>
                <span>
                  <span className="block font-bold">{s.title}</span>
                  <span className="mt-1 block text-sm text-ink-soft">{s.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="who-title">
          <h2 id="who-title" className="text-2xl font-bold sm:text-3xl">Who it is for</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {AUDIENCES.map((a, i) => (
              <li key={a.title} className={`border-t-[3px] pt-4 ${['border-marigold', 'border-leaf', 'border-leaf', 'border-blue', 'border-leaf'][i] || 'border-line'}`}>
                <a.icon size={24} className="text-ink" aria-hidden />
                <p className="mt-3 font-bold">{a.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{a.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-ink-soft">
            New here? The <Link to="/help" className="font-semibold text-terracotta underline">Help centre</Link> has a step-by-step guide for each of these.
          </p>
        </section>

        <CraftsOfIndia />

        <section aria-labelledby="trust-title" className="rounded-2xl bg-mist p-6 sm:p-10">
          <h2 id="trust-title" className="text-2xl font-bold sm:text-3xl">Trust and safety</h2>
          <p className="mt-1 text-ink-soft">How we keep people and their data safe.</p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <li key={t.title}>
                <t.icon size={26} className="text-tulsi" aria-hidden />
                <p className="mt-3 font-bold">{t.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{t.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contact-title" className="grid gap-6 md:grid-cols-2">
          <div id="contact" className="panel scroll-mt-24 p-6">
            <h2 id="contact-title" className="text-2xl font-bold">Contact our customer care</h2>
            <p className="mt-1 text-ink-soft">Questions about a booking, a camp or kitchen to list, or a campus or corporate event? We are here to help.</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a className="flex min-h-11 items-center gap-3 font-semibold underline" href={`mailto:${SITE.email}`}>
                  <Mail size={20} className="shrink-0" aria-hidden /> <span className="min-w-0 [overflow-wrap:anywhere]">{SITE.email}</span>
                </a>
              </li>
              <li>
                <a className="flex min-h-11 items-center gap-3 font-semibold underline" href={tel}>
                  <Phone size={20} aria-hidden /> {SITE.phone}
                </a>
              </li>
            </ul>
            <p className="mt-4 rounded-xl bg-kumkum-wash p-3 text-sm">
              In an emergency at an event, call <a className="font-bold text-kumkum" href="tel:112">112</a> or medical{' '}
              <a className="font-bold text-kumkum" href="tel:108">108</a>, or use the <Link className="font-bold underline" to={`/yatra/${SITE.flagshipSlug}?tab=sos`}>SOS button</Link>.
            </p>
          </div>

          <div className="cg-band flex flex-col justify-between gap-4 rounded-2xl p-6">
            <div>
              <p className="cg-kicker text-saffron-light">Quick help</p>
              <h2 className="mt-1 text-2xl font-bold">Chat with customer care on WhatsApp</h2>
              <p className="mt-2 text-blue-mist">Send us a message and our team will get back to you, usually within a few hours.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className="btn-primary" href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi CrowdGrid customer care, I have a question.')}`} target="_blank" rel="noreferrer">
                <MessageCircle size={20} aria-hidden /> Chat on WhatsApp
              </a>
              <a className="btn border-[1.5px] border-white/40 text-white hover:bg-white/10" href={`mailto:${SITE.email}`}>
                <Mail size={20} aria-hidden /> Email us
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BedDouble, Code2, Mail, Phone, QrCode, ShieldCheck, Siren, UtensilsCrossed, Users } from 'lucide-react';
import { SITE } from '../lib/site';

const MILESTONES = [
  { title: 'Version 1: the MERN foundation', text: 'Events, login and a first booking flow on MongoDB, Express, React and Node.js.' },
  { title: 'Zero double-booking', text: 'Atomic database updates, transactions and unique indexes. 200 people racing for 10 beds: exactly 10 bookings.' },
  { title: 'Signed QR passes and the scanner', text: 'HMAC-signed passes, single-use redemption, an offline passbook and a camera scanner for volunteers.' },
  { title: 'Six roles and a control room', text: 'Pilgrims, volunteers, NGO admins, corporate admins, authorities and super admin, each with their own screens.' },
  { title: 'Security hardening', text: 'Account lockout, rate limits, NoSQL-injection filtering, log out of all devices and an audit log.' },
  { title: 'Invite-only corporate events', text: 'Access codes, WhatsApp and email invitations, printable invitation cards and attendee lists.' },
  { title: 'Families, tents and payments', text: 'Family meal tokens with menus, tent and bed numbers, a cart with simulated UPI and card payment, and one QR per person.' },
];

const SERVICES = [
  { icon: BedDouble, title: 'Lodging', text: 'Verified camps with tent and bed numbers' },
  { icon: UtensilsCrossed, title: 'Annadanam', text: 'Meal tokens for the whole family' },
  { icon: QrCode, title: 'One QR', text: 'A single code for every pass' },
  { icon: Siren, title: 'SOS', text: 'Emergency alerts and lost & found' },
];

export default function About() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);
  return (
    <div className="pb-6">
      <section className="bg-ink text-white">
        <div className="toran" aria-hidden />
        <div className="shell py-10">
          <p className="text-[#c9d6ee]">About</p>
          <h1 className="font-display text-4xl">CrowdGrid</h1>
          <p className="mt-3 max-w-prose text-lg text-[#d5deed]">
            One platform for pilgrims, seva groups and authorities at India's largest gatherings, starting with the Simhastha Kumbh Mela 2027
            at Nashik–Trimbakeshwar.
          </p>
        </div>
      </section>

      <div className="shell space-y-12 py-10">
        <section aria-labelledby="mission" className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 id="mission" className="text-2xl font-bold">Why we built it</h2>
            <p className="mt-2 text-ink-soft">
              At a mela, shelter, food and transport are run by hundreds of trusts and departments, each on its own. Pilgrims queue for
              everything, paper tokens get copied, and families get separated. CrowdGrid brings every service into one place, issues
              tamper-proof QR passes, and gives authorities a live view of the ground.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <li key={s.title} className="panel p-4">
                <s.icon className="text-kumkum" size={24} aria-hidden />
                <p className="mt-2 font-bold">{s.title}</p>
                <p className="text-sm text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="done">
          <h2 id="done" className="text-2xl font-bold">What we have done so far</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-marigold pl-6">
            {MILESTONES.map((m, i) => (
              <li key={m.title} className="relative">
                <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full bg-marigold text-sm font-bold text-ink">{i + 1}</span>
                <p className="font-bold">{m.title}</p>
                <p className="text-ink-soft">{m.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="team" className="grid gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <h2 id="team" className="flex items-center gap-2 text-2xl font-bold"><Users size={22} aria-hidden /> The team</h2>
            <ul className="mt-3 space-y-1">
              {SITE.team.map((n) => <li key={n} className="text-lg">{n}</li>)}
            </ul>
            <p className="mt-3 text-ink-soft">Guided by {SITE.guide}</p>
            <p className="text-ink-soft">{SITE.institute}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft"><ShieldCheck size={16} aria-hidden /> Full Stack Development mini project, MERN stack</p>
          </div>

          <div id="contact" className="panel scroll-mt-24 p-6">
            <h2 className="text-2xl font-bold">Contact the owner</h2>
            <p className="mt-1 text-ink-soft">Questions, partnerships or a camp to list? Reach {SITE.owner}.</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a className="flex items-center gap-3 font-semibold underline" href={`mailto:${SITE.email}`}>
                  <Mail size={20} aria-hidden /> {SITE.email}
                </a>
              </li>
              <li>
                <a className="flex items-center gap-3 font-semibold underline" href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`}>
                  <Phone size={20} aria-hidden /> {SITE.phone}
                </a>
              </li>
              {SITE.github.map((g) => (
                <li key={g.url}>
                  <a className="flex items-center gap-3 font-semibold underline" href={g.url} target="_blank" rel="noreferrer">
                    <Code2 size={20} aria-hidden /> {g.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-kumkum-wash p-3 text-sm">
              In an emergency at the mela, call <a className="font-bold text-kumkum" href="tel:112">112</a> or medical{' '}
              <a className="font-bold text-kumkum" href="tel:108">108</a>, or use the <Link className="font-bold underline" to={`/yatra/${SITE.flagshipSlug}?tab=sos`}>SOS button</Link>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

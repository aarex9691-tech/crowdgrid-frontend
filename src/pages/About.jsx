import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { SITE } from '../lib/site';

/** About us: company details and customer care only. */
export default function About() {
  const tel = `tel:${SITE.phone.replace(/[^\d+]/g, '')}`;
  return (
    <div className="pb-6">
      <section className="bg-ink text-white">
        <div className="toran" aria-hidden />
        <div className="shell py-10">
          <p className="text-[#c9d6ee]">About us</p>
          <h1 className="font-display text-4xl">{SITE.name}</h1>
          <p className="mt-1 text-lg font-semibold text-marigold">{SITE.tagline}</p>
          <p className="mt-3 max-w-prose text-lg text-[#d5deed]">
            One platform for pilgrims, seva groups and authorities at India's largest gatherings: verified stays, meal tokens, transport,
            seva and emergency help, with a single QR pass. Starting with the Simhastha Kumbh Mela 2026–28 at Nashik–Trimbakeshwar.
          </p>
        </div>
      </section>

      <div className="shell py-10">
        <section aria-labelledby="contact-title" className="grid gap-6 md:grid-cols-2">
          <div id="contact" className="panel scroll-mt-24 p-6">
            <h2 id="contact-title" className="text-2xl font-bold">Contact our customer care</h2>
            <p className="mt-1 text-ink-soft">Questions about a booking, a camp or kitchen to list, or a corporate event? We are here to help.</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a className="flex items-center gap-3 font-semibold underline" href={tel}>
                  <Phone size={20} aria-hidden /> {SITE.phone}
                </a>
              </li>
              <li>
                <a className="flex items-center gap-3 font-semibold underline" href={`mailto:${SITE.email}`}>
                  <Mail size={20} aria-hidden /> {SITE.email}
                </a>
              </li>
            </ul>
            <p className="mt-4 rounded-xl bg-kumkum-wash p-3 text-sm">
              In an emergency at the mela, call <a className="font-bold text-kumkum" href="tel:112">112</a> or medical{' '}
              <a className="font-bold text-kumkum" href="tel:108">108</a>, or use the <Link className="font-bold underline" to={`/yatra/${SITE.flagshipSlug}?tab=sos`}>SOS button</Link>.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-ink p-6 text-white">
            <div>
              <p className="text-sm uppercase tracking-wide text-marigold">Quick help</p>
              <h2 className="mt-1 text-2xl font-bold">Chat with customer care on WhatsApp</h2>
              <p className="mt-2 text-[#c9d6ee]">Send us a message and our team will get back to you.</p>
            </div>
            <a className="btn-primary self-start" href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi CrowdGrid customer care, I have a question.')}`} target="_blank" rel="noreferrer">
              <MessageCircle size={20} aria-hidden /> Chat on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

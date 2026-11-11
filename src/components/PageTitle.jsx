/**
 * Title block shared by every dashboard and personal page:
 * which role the page belongs to (a dot in that role's colour), the page title in the display
 * face, and one short line under it. Put it inside a `cg-pagehead` row so actions sit on the right.
 */
const TONES = {
  saffron: '#e36f1e', // attendees
  green: '#138a43', // volunteers, NGOs, corporate hosts
  blue: '#1f3f8f', // authorities and admins
};

export default function PageTitle({ kicker, tone = 'blue', title, lead }) {
  return (
    <div className="min-w-0">
      {kicker && <p className="cg-role" style={{ '--role-tone': TONES[tone] || TONES.blue }}>{kicker}</p>}
      <h1 className="mt-1 flex flex-wrap items-center gap-3 text-3xl sm:text-4xl">{title}</h1>
      {lead && <p className="mt-1.5 max-w-prose text-ink-soft">{lead}</p>}
    </div>
  );
}

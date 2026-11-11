/**
 * Title block shared by every dashboard and personal page:
 * a small role label in that role's colour, the page title in the display face, one short line under it.
 * Put it inside a `cg-pagehead` row so actions (buttons, pickers) sit on the right.
 */
const TONES = {
  saffron: 'text-terracotta', // attendees
  green: 'text-tulsi', // volunteers, NGOs, corporate hosts
  blue: 'text-blue', // authorities and admins
};

export default function PageTitle({ kicker, tone = 'blue', title, lead }) {
  return (
    <div className="min-w-0">
      {kicker && <p className={`cg-kicker ${TONES[tone] || TONES.blue}`}>{kicker}</p>}
      <h1 className="mt-1 flex flex-wrap items-center gap-3 text-3xl sm:text-4xl">{title}</h1>
      {lead && <p className="mt-1.5 max-w-prose text-ink-soft">{lead}</p>}
    </div>
  );
}

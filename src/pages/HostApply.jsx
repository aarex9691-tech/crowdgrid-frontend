import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeCheck, QrCode, ScanLine, ShieldCheck, Users } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import { fmtDate } from '../lib/format';
import PageTitle from '../components/PageTitle';
import Notice, { Loading } from '../components/Notice';
import { TextField } from '../components/Fields';
import PhoneField from '../components/PhoneField';
import { useCelebrate } from '../components/SuccessSplash';

/*
 * "Host with CrowdGrid": an organisation (college, charity, cultural group, company...) asks to
 * run its own events. The Super Admin checks the registration number and certificate first.
 */

const KINDS = [
  { id: 'PUBLIC', title: 'Public events', line: 'Concerts, aartis, heritage walks, fests open to everyone' },
  { id: 'CORPORATE', title: 'Campus & corporate', line: 'Invite-only seminars, summits and college events' },
  { id: 'BOTH', title: 'Both', line: 'For colleges, universities and charities that run both' },
];
const ORG_TYPES = [
  ['EDUCATION', 'College / university / school'],
  ['CHARITY', 'Charity / NGO / trust'],
  ['CULTURAL', 'Cultural or religious group'],
  ['COMPANY', 'Company / business'],
  ['GOVT', 'Government body'],
  ['OTHER', 'Other'],
];
const ID_TYPES = [
  ['GSTIN', 'GSTIN', '15 characters, e.g. 27AAPFU0939F1ZV'],
  ['CIN', 'CIN (company)', '21 characters, e.g. U72200MH2009PTC123456'],
  ['DARPAN', 'NGO Darpan ID', 'e.g. MH/2017/0123456'],
  ['AISHE', 'AISHE code (college / university)', 'e.g. C-12345'],
  ['UDYAM', 'Udyam registration', 'e.g. UDYAM-MH-12-0012345'],
  ['REG', 'Trust / society registration number', 'As printed on the certificate'],
];
const STATUS = {
  PENDING: { text: 'Waiting for review', cls: 'pill-low' },
  APPROVED: { text: 'Approved', cls: 'pill-ok' },
  REJECTED: { text: 'Not approved', cls: 'pill-out' },
};

const EMPTY = {
  kind: '', orgName: '', orgType: '', idType: 'GSTIN', idNumber: '', city: '', contactName: '',
  contactCountryCode: '91', contactPhone: '', contactEmail: '', website: '', expectedSize: '', description: '',
};

function Benefits() {
  const items = [
    [QrCode, 'Tickets and badges on one QR', 'Free or paid tickets, group bookings and invite codes, all checked out on CrowdGrid.'],
    [ScanLine, 'Your own check-in desk', 'Your staff scan entries at the gate. Your scanner only accepts your own events.'],
    [Users, 'Attendees and sales', 'See who registered, how many checked in, and ticket revenue.'],
    [BadgeCheck, 'Verified organiser badge', 'Every event you publish shows that CrowdGrid checked your organisation.'],
  ];
  return (
    <ul className="space-y-4">
      {items.map(([Icon, title, line]) => (
        <li key={title} className="flex gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-blue-wash text-blue"><Icon size={20} aria-hidden /></span>
          <span>
            <span className="block font-bold">{title}</span>
            <span className="block text-ink-soft">{line}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Steps() {
  return (
    <ol className="space-y-3">
      {[
        ['Apply', 'Your organisation\'s details, its registration number and a copy of the certificate.'],
        ['We verify', 'The CrowdGrid team checks the number and the certificate, usually within 2 working days. We may call the contact number.'],
        ['Publish', 'Once approved, your account becomes a host account and you publish events yourself.'],
      ].map(([title, line], i) => (
        <li key={title} className="flex gap-3">
          <span className="grid size-8 flex-none place-items-center rounded-full border-2 border-marigold font-bold text-terracotta-dark">{i + 1}</span>
          <span>
            <span className="block font-bold">{title}</span>
            <span className="block text-ink-soft">{line}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function MyRequests({ list }) {
  if (!list.length) return null;
  return (
    <section aria-labelledby="mine-title" className="panel p-5">
      <h2 id="mine-title" className="text-xl font-bold">Your requests</h2>
      <ul className="mt-3 divide-y divide-line">
        {list.map((a) => (
          <li key={a._id} className="py-3" data-no-translate>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">{a.orgName}</span>
              <span className={STATUS[a.status]?.cls}>{STATUS[a.status]?.text}</span>
            </div>
            <p className="text-sm text-ink-soft">
              {KINDS.find((k) => k.id === a.kind)?.title}. Sent {fmtDate(a.createdAt)}
              {a.reviewedAt ? `, reviewed ${fmtDate(a.reviewedAt)}` : ''}.
            </p>
            {a.status === 'REJECTED' && a.rejectionReason && (
              <p className="mt-1 text-[15px]"><b>Reason:</b> {a.rejectionReason} You can correct this and apply again.</p>
            )}
            {a.status === 'APPROVED' && <p className="mt-1 text-[15px]">Log out and in again to open your host dashboard.</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ApplyForm({ onSent }) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const celebrate = useCelebrate();
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const idHint = ID_TYPES.find(([id]) => id === form.idType)?.[2];

  const submit = async (e) => {
    e.preventDefault();
    setTried(true);
    setError('');
    if (!form.kind) return setError('Choose which events you want to host.');
    if (!form.orgType) return setError('Choose the type of organisation.');
    if (!file) return setError('Attach the registration certificate (PDF or photo).');
    if (file.size > 2 * 1024 * 1024) return setError('The certificate is too large. Use a file under 2 MB.');
    if (!agree) return setError('Confirm that the details are correct and you may act for the organisation.');
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append('document', file);
    setBusy(true);
    try {
      await API.post('/hosts/apply', body);
      celebrate({ title: 'Request sent', line: 'We will check your organisation and update you here.' });
      setForm(EMPTY);
      setFile(null);
      setAgree(false);
      setTried(false);
      onSent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel space-y-5 p-5 sm:p-6" noValidate>
      <h2 className="text-2xl font-bold">Apply to host</h2>

      <fieldset>
        <legend className="field-label">Which events will you host?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label key={k.id} className={`flex cursor-pointer flex-col rounded-xl border-[1.5px] p-3 ${form.kind === k.id ? 'border-blue bg-blue-wash' : 'border-edge bg-white hover:bg-mist'}`}>
              <span className="flex items-center gap-2 font-bold">
                <input type="radio" name="kind" value={k.id} checked={form.kind === k.id} onChange={() => put('kind')(k.id)} className="size-4 accent-blue" />
                {k.title}
              </span>
              <span className="mt-1 text-sm text-ink-soft">{k.line}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="h-org" label="Organisation name" rule="orgName" value={form.orgName} onChange={put('orgName')} required showErrors={tried} autoComplete="organization" />
        <div>
          <label className="field-label" htmlFor="h-type">Type of organisation</label>
          <select id="h-type" className="field" value={form.orgType} onChange={(e) => put('orgType')(e.target.value)} required>
            <option value="">Choose</option>
            {ORG_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="h-idtype">Registration number type</label>
          <select id="h-idtype" className="field" value={form.idType} onChange={(e) => put('idType')(e.target.value)}>
            {ID_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="h-id">Registration number</label>
          <input id="h-id" className="field font-mono uppercase" value={form.idNumber} onChange={(e) => put('idNumber')(e.target.value.slice(0, 40))} autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-describedby="h-id-hint" required />
          <p id="h-id-hint" className="mt-1 text-sm text-ink-soft">{idHint}</p>
        </div>
        <TextField id="h-city" label="City" rule="city" value={form.city} onChange={put('city')} required showErrors={tried} autoComplete="address-level2" />
        <TextField id="h-contact" label="Contact person" rule="personName" value={form.contactName} onChange={put('contactName')} required showErrors={tried} autoComplete="name" />
        <PhoneField id="h-phone" label="Contact number" countryCode={form.contactCountryCode} phone={form.contactPhone} onChange={({ countryCode, phone }) => setForm((f) => ({ ...f, contactCountryCode: countryCode, contactPhone: phone }))} showErrors={tried} />
        <div>
          <label className="field-label" htmlFor="h-email">Official email <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id="h-email" type="email" className="field" value={form.contactEmail} onChange={(e) => put('contactEmail')(e.target.value.replace(/\s/g, ''))} autoComplete="email" maxLength={120} placeholder="office@yourcollege.edu.in" />
        </div>
        <div>
          <label className="field-label" htmlFor="h-web">Website <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id="h-web" className="field" value={form.website} onChange={(e) => put('website')(e.target.value.trim())} inputMode="url" autoComplete="url" maxLength={200} placeholder="www.yourcollege.edu.in" />
        </div>
        <div>
          <label className="field-label" htmlFor="h-size">People at your largest event <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id="h-size" className="field" inputMode="numeric" value={form.expectedSize} onChange={(e) => put('expectedSize')(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="e.g. 800" />
        </div>
      </div>
      <TextField id="h-about" label="About your events" rule="longText" value={form.description} onChange={put('description')} multiline rows={3} showErrors={tried} placeholder="What you run, how often, and where." />

      <div>
        <label className="field-label" htmlFor="h-doc">Registration certificate</label>
        <input id="h-doc" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-mist file:px-3 file:py-1.5 file:font-semibold" onChange={(e) => setFile(e.target.files?.[0] || null)} aria-describedby="h-doc-hint" required />
        <p id="h-doc-hint" className="mt-1 text-sm text-ink-soft">A PDF or a clear photo, under 2 MB. Only the CrowdGrid team can see it.</p>
      </div>

      <label className="flex items-start gap-3 text-[15px]">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-5 flex-none accent-blue" />
        <span>The details are correct, and I am allowed to apply on behalf of this organisation.</span>
      </label>

      <Notice tone="error">{error}</Notice>
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? 'Sending…' : 'Send for verification'}</button>
    </form>
  );
}

export default function HostApply() {
  const { user } = useAuth();
  const location = useLocation();
  const [mine, setMine] = useState(null);
  const [error, setError] = useState('');
  const isPilgrim = user?.role === 'USER';

  const load = () => {
    setError('');
    return API.get('/hosts/mine')
      .then(({ data }) => setMine(data))
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(() => {
    if (isPilgrim) load();
  }, [isPilgrim]);

  const waiting = mine?.some((a) => a.status === 'PENDING');
  const approved = mine?.some((a) => a.status === 'APPROVED');
  const loadFailed = (
    <div className="space-y-3">
      <Notice tone="error">{error}</Notice>
      <button type="button" className="btn-ghost" onClick={load}>Try again</button>
    </div>
  );

  let side;
  if (!user) {
    side = (
      <div className="panel p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Apply to host</h2>
        <p className="mt-2 text-ink-soft">Log in, or create a free account with your mobile number, then fill in your organisation's details here.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/login" state={{ from: location.pathname }} className="btn-primary">Log in</Link>
          <Link to="/register" state={{ from: location.pathname }} className="btn-ghost">Create an account</Link>
        </div>
      </div>
    );
  } else if (!isPilgrim) {
    side = (
      <div className="panel p-5 sm:p-6">
        <h2 className="text-2xl font-bold">You have a {ROLE_LABELS[user.role] || 'staff'} account</h2>
        <p className="mt-2 text-ink-soft">
          Staff and host accounts cannot apply. To register another organisation, apply from a personal account.
        </p>
        <Link to={homeFor(user.role)} className="btn-primary mt-4">Open my dashboard</Link>
      </div>
    );
  } else if (!mine) {
    side = error ? loadFailed : <Loading />;
  } else {
    side = (
      <div className="space-y-4">
        {error && loadFailed}
        <MyRequests list={mine} />
        {approved ? null : waiting ? <Notice>Your request is with the CrowdGrid team. You can send another once it has been reviewed.</Notice> : <ApplyForm onSent={load} />}
      </div>
    );
  }

  return (
    <div className="shell space-y-6 py-8">
      <PageTitle
        kicker="For organisers"
        tone="blue"
        title="Host your events on CrowdGrid"
        lead="Colleges, charities, cultural groups and companies can run their own events here. We verify every organisation before its first event goes live."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-8">
          <section aria-labelledby="get-title">
            <h2 id="get-title" className="mb-4 text-xl font-bold">What you get</h2>
            <Benefits />
          </section>
          <section aria-labelledby="how-title">
            <h2 id="how-title" className="mb-4 flex items-center gap-2 text-xl font-bold"><ShieldCheck size={20} aria-hidden /> How verification works</h2>
            <Steps />
          </section>
          <p className="text-sm text-ink-soft">Pilgrimage camps and kitchens register differently: NGOs apply from the Seva tab of a yatra.</p>
        </div>
        <div>{side}</div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarHeart, ChefHat, ScanLine, ShieldCheck } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { homeFor, ROLE_LABELS, useAuth } from '../lib/auth';
import { fmtDate } from '../lib/format';
import PageTitle from '../components/PageTitle';
import Notice, { Loading } from '../components/Notice';
import { TextField } from '../components/Fields';
import PhoneField from '../components/PhoneField';
import { useCelebrate } from '../components/SuccessSplash';

/*
 * "Register a kitchen service": a langar trust, annakshetra or community kitchen asks to be
 * recognised. The Super Admin checks the licence or registration number and the certificate once;
 * then, for each yatra, the kitchen asks that yatra's District Control Room from its dashboard.
 */

const ORG_TYPES = [
  ['TRUST', 'Langar / annadan trust'],
  ['COMMUNITY_KITCHEN', 'Community kitchen'],
  ['NGO', 'NGO'],
  ['ASHRAM', 'Ashram or math'],
  ['COMPANY', 'Company (CSR kitchen)'],
  ['OTHER', 'Other'],
];
const ID_TYPES = [
  ['FSSAI', 'FSSAI licence', '14 digits, e.g. 11524033000417'],
  ['GSTIN', 'GSTIN', '15 characters, e.g. 27AAPFU0939F1ZV'],
  ['DARPAN', 'NGO Darpan ID', 'e.g. MH/2017/0123456'],
  ['UDYAM', 'Udyam registration', 'e.g. UDYAM-MH-12-0012345'],
  ['REG', 'Trust / society registration number', 'As printed on the certificate'],
];
const STATUS = {
  PENDING: { text: 'Waiting for the Super Admin', cls: 'pill-low' },
  APPROVED: { text: 'Recognised', cls: 'pill-ok' },
  REJECTED: { text: 'Not recognised', cls: 'pill-out' },
};
const EMPTY = { orgName: '', orgType: '', idType: 'FSSAI', idNumber: '', city: '', contactName: '', contactCountryCode: '91', contactPhone: '', mealsPerDay: '', description: '' };

function Steps() {
  return (
    <ol className="space-y-3">
      {[
        ['Register once', 'Your kitchen\'s details, its FSSAI licence or registration number, and a copy of the certificate. The CrowdGrid team (Super Admin) checks them.'],
        ['Ask for each yatra', 'From your dashboard, ask the District Control Room of the yatra you want to serve at. Another yatra later? Ask again.'],
        ['Serve', 'Once approved, list your kitchens and meal tokens, hold programmes for pilgrims (bhandara, satsang, health camp) and scan tokens and passes.'],
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
    if (!form.orgType) return setError('Choose the type of kitchen service.');
    if (form.idType === 'FSSAI' && !/^\d{14}$/.test(form.idNumber.replace(/\s/g, ''))) return setError('An FSSAI licence number has 14 digits.');
    if (!file) return setError('Attach the licence or registration certificate (PDF or photo).');
    if (file.size > 2 * 1024 * 1024) return setError('The certificate is too large. Use a file under 2 MB.');
    if (!agree) return setError('Confirm that the details are correct and you may act for the kitchen.');
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append('document', file);
    setBusy(true);
    try {
      await API.post('/kitchens/apply', body);
      celebrate({ title: 'Request sent', line: 'The CrowdGrid team will check your kitchen and update you here.' });
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
      <h2 className="text-2xl font-bold">Register your kitchen service</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="k-org" label="Name of the kitchen service" rule="orgName" value={form.orgName} onChange={put('orgName')} required showErrors={tried} autoComplete="organization" />
        <div>
          <label className="field-label" htmlFor="k-type">Type</label>
          <select id="k-type" className="field" value={form.orgType} onChange={(e) => put('orgType')(e.target.value)} required>
            <option value="">Choose</option>
            {ORG_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="k-idtype">Licence or registration</label>
          <select id="k-idtype" className="field" value={form.idType} onChange={(e) => put('idType')(e.target.value)}>
            {ID_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="k-id">Number</label>
          <input id="k-id" className="field font-mono uppercase" value={form.idNumber} onChange={(e) => put('idNumber')(e.target.value.slice(0, 40))} autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-describedby="k-id-hint" required />
          <p id="k-id-hint" className="mt-1 text-sm text-ink-soft">{idHint}</p>
        </div>
        <TextField id="k-city" label="City" rule="city" value={form.city} onChange={put('city')} required showErrors={tried} autoComplete="address-level2" />
        <TextField id="k-contact" label="Person in charge" rule="personName" value={form.contactName} onChange={put('contactName')} required showErrors={tried} autoComplete="name" />
        <PhoneField id="k-phone" label="Contact number" countryCode={form.contactCountryCode} phone={form.contactPhone} onChange={({ countryCode, phone }) => setForm((f) => ({ ...f, contactCountryCode: countryCode, contactPhone: phone }))} showErrors={tried} />
        <div>
          <label className="field-label" htmlFor="k-meals">Meals you can serve a day <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id="k-meals" className="field" inputMode="numeric" value={form.mealsPerDay} onChange={(e) => put('mealsPerDay')(e.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="e.g. 1500" />
        </div>
      </div>
      <TextField id="k-about" label="About your kitchen" rule="longText" value={form.description} onChange={put('description')} multiline rows={3} showErrors={tried} placeholder="What you cook, for how many, and where you have served before." />
      <div>
        <label className="field-label" htmlFor="k-doc">Licence or registration certificate</label>
        <input id="k-doc" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="field file:mr-3 file:rounded-lg file:border-0 file:bg-mist file:px-3 file:py-1.5 file:font-semibold" onChange={(e) => setFile(e.target.files?.[0] || null)} aria-describedby="k-doc-hint" required />
        <p id="k-doc-hint" className="mt-1 text-sm text-ink-soft">A PDF or a clear photo, under 2 MB. Only the CrowdGrid team can see it.</p>
      </div>
      <label className="flex items-start gap-3 text-[15px]">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-5 flex-none accent-blue" />
        <span>The details are correct, and I am allowed to apply on behalf of this kitchen service.</span>
      </label>
      <Notice tone="error">{error}</Notice>
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? 'Sending…' : 'Send for recognition'}</button>
    </form>
  );
}

export default function KitchenApply() {
  const { user } = useAuth();
  const location = useLocation();
  const [mine, setMine] = useState(null);
  const [error, setError] = useState('');
  const isPilgrim = user?.role === 'USER';

  const load = () => {
    setError('');
    return API.get('/kitchens/mine')
      .then(({ data }) => setMine(data.recognition))
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(() => {
    if (isPilgrim) load();
  }, [isPilgrim]);

  let side;
  if (!user) {
    side = (
      <div className="panel p-5 sm:p-6">
        <h2 className="text-2xl font-bold">Register your kitchen service</h2>
        <p className="mt-2 text-ink-soft">Log in, or create a free account with your mobile number, then fill in your kitchen's details here.</p>
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
        <p className="mt-2 text-ink-soft">Staff and organisation accounts cannot apply. Register the kitchen from a personal account.</p>
        <Link to={homeFor(user.role)} className="btn-primary mt-4">Open my dashboard</Link>
      </div>
    );
  } else if (!mine) {
    side = error ? (
      <div className="space-y-3">
        <Notice tone="error">{error}</Notice>
        <button type="button" className="btn-ghost" onClick={load}>Try again</button>
      </div>
    ) : (
      <Loading />
    );
  } else {
    const open = mine.some((a) => a.status !== 'REJECTED');
    side = (
      <div className="space-y-4">
        {mine.length > 0 && (
          <section aria-labelledby="k-mine" className="panel p-5" data-no-translate>
            <h2 id="k-mine" className="text-xl font-bold">Your requests</h2>
            <ul className="mt-3 divide-y divide-line">
              {mine.map((a) => (
                <li key={a._id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{a.orgName}</span>
                    <span className={STATUS[a.status]?.cls}>{STATUS[a.status]?.text}</span>
                  </div>
                  <p className="text-sm text-ink-soft">Sent {fmtDate(a.createdAt)}</p>
                  {a.status === 'REJECTED' && a.rejectionReason && <p className="mt-1 text-[15px]"><b>Reason:</b> {a.rejectionReason} You can correct this and apply again.</p>}
                  {a.status === 'APPROVED' && <p className="mt-1 text-[15px]">Log out and in again to open your kitchen dashboard.</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {open ? (mine.some((a) => a.status === 'PENDING') ? <Notice>Your request is with the CrowdGrid team.</Notice> : null) : <ApplyForm onSent={load} />}
      </div>
    );
  }

  return (
    <div className="shell space-y-6 py-8">
      <PageTitle
        kicker="For kitchen services"
        tone="green"
        title="Serve pilgrims from your kitchen"
        lead="Langar trusts, annakshetras and community kitchens: get recognised once, then ask each yatra's District Control Room to serve there."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-8">
          <section aria-labelledby="k-how">
            <h2 id="k-how" className="mb-4 flex items-center gap-2 text-xl font-bold"><ShieldCheck size={20} aria-hidden /> How it works</h2>
            <Steps />
          </section>
          <ul className="space-y-3 text-[15px]">
            <li className="flex gap-3"><ChefHat size={20} className="flex-none text-terracotta-dark" aria-hidden /> Meal tokens for each kitchen, with daily quotas and meals served.</li>
            <li className="flex gap-3"><CalendarHeart size={20} className="flex-none text-terracotta-dark" aria-hidden /> Programmes for pilgrims, with free places and a head count.</li>
            <li className="flex gap-3"><ScanLine size={20} className="flex-none text-terracotta-dark" aria-hidden /> Your own scanner for tokens and programme passes.</li>
          </ul>
        </div>
        <div>{side}</div>
      </div>
    </div>
  );
}

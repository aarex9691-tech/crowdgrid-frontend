import { useState } from 'react';
import { CheckCircle2, HeartPulse, Pencil, Phone, UserRound, X } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { ROLE_LABELS, useAuth } from '../lib/auth';
import { formatPhone } from '../lib/phone';
import { emailError, firstError, optionalPhoneError, textError } from '../lib/validate';
import Notice from './Notice';
import PhoneField from './PhoneField';
import { TextField } from './Fields';

const GENDERS = { FEMALE: 'Female', MALE: 'Male', OTHER: 'Other' };
const isoDay = (d) => (d ? new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '');
const MIN_AGE = 18;
const todayParts = () => isoDay(new Date()).split('-').map(Number);
/** Whole years on today's date in India; null for an empty or impossible date. */
const ageFrom = (d) => {
  const day = d ? (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : isoDay(d)) : '';
  if (!day) return null;
  const [y, m, dd] = day.split('-').map(Number);
  const [ty, tm, td] = todayParts();
  const age = ty - y - (tm < m || (tm === m && td < dd) ? 1 : 0);
  return age >= 0 ? age : null;
};
/** Latest allowed birth date: exactly MIN_AGE years ago today. */
const latestDob = () => {
  const [ty, tm, td] = todayParts();
  return `${ty - MIN_AGE}-${String(tm).padStart(2, '0')}-${String(td).padStart(2, '0')}`;
};
const earliestDob = () => `${todayParts()[0] - 120}-01-01`;
const fmtDay = (iso) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

/** The three groups of the profile; each is edited on its own so the form stays short. */
const GROUPS = {
  personal: { label: 'Personal', icon: UserRound },
  contact: { label: 'Contact', icon: Phone },
  emergency: { label: 'Emergency', icon: HeartPulse },
};

/** What is still missing, in the order we suggest filling it in. */
const missingItems = (u) => [
  !u.dateOfBirth && { group: 'personal', label: 'Date of birth' },
  !u.gender && { group: 'personal', label: 'Gender' },
  !u.city && { group: 'personal', label: 'City' },
  !u.email && { group: 'contact', label: 'Email' },
  !u.emergencyContact?.phone && { group: 'emergency', label: 'Emergency contact' },
].filter(Boolean);
const TOTAL_ITEMS = 7; // name and mobile are always present, plus the 5 above

function Fact({ label, value }) {
  return (
    <div className="flex min-w-0 justify-between gap-3 py-1.5 text-[15px]">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`min-w-0 truncate text-right ${value ? 'font-semibold text-ink' : 'text-ink-faint'}`} title={value || undefined}>{value || 'Not added'}</dd>
    </div>
  );
}

/**
 * Compact profile: a header with initials, role and how complete the profile is,
 * then three small cards (Personal, Contact, Emergency). "Edit" opens a short form
 * for just that card.
 */
export default function ProfilePanel() {
  const { user, refresh } = useAuth();
  const [group, setGroup] = useState(null); // which card is being edited
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const open = (g) => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      dateOfBirth: isoDay(user.dateOfBirth),
      gender: user.gender || '',
      city: user.city || '',
      ecName: user.emergencyContact?.name || '',
      ecCountryCode: user.emergencyContact?.countryCode || '91',
      ecPhone: user.emergencyContact?.phone || '',
    });
    setSaved('');
    setError('');
    setTried(false);
    setGroup(g);
  };
  const close = () => { setGroup(null); setError(''); };
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const dobAge = form?.dateOfBirth ? ageFrom(form.dateOfBirth) : null;
  const dobError = form?.dateOfBirth && (dobAge === null || dobAge < MIN_AGE)
    ? `You must be at least ${MIN_AGE} years old. Choose a date on or before ${fmtDay(latestDob())}.`
    : '';

  /** Only the fields of the open card are checked and sent. */
  const save = async (e) => {
    e.preventDefault();
    setTried(true);
    setError('');
    let body;
    let problem;
    if (group === 'personal') {
      problem = firstError(textError(form.name, 'Full name', 'personName', { required: true }), dobError, textError(form.city, 'City', 'city'));
      body = { name: form.name, dateOfBirth: form.dateOfBirth, gender: form.gender, city: form.city };
    } else if (group === 'contact') {
      problem = emailError(form.email);
      body = { email: form.email.trim() };
    } else {
      const ownNumber = form.ecPhone && form.ecPhone === user.phone && form.ecCountryCode === (user.countryCode || '91');
      const hasAny = form.ecName.trim() || form.ecPhone;
      problem = firstError(
        textError(form.ecName, 'Contact name', { min: 2, max: 60, kind: 'name' }),
        optionalPhoneError(form.ecCountryCode, form.ecPhone, { required: !!hasAny }),
        ownNumber ? 'The emergency contact must be someone else, not your own number' : '',
      );
      body = { emergencyContact: { name: form.ecName.trim(), countryCode: form.ecCountryCode, phone: form.ecPhone } };
    }
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await API.patch('/auth/me', body);
      await refresh();
      setSaved(`${GROUPS[group].label} details saved.`);
      setGroup(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const age = ageFrom(user.dateOfBirth);
  const missing = missingItems(user);
  const pct = Math.round(((TOTAL_ITEMS - missing.length) / TOTAL_ITEMS) * 100);
  const ec = user.emergencyContact;

  const cards = {
    personal: [
      ['Name', user.name],
      ['Age', age !== null ? `${age} years` : null],
      ['Gender', GENDERS[user.gender]],
      ['City', user.city],
    ],
    contact: [
      ['Mobile', formatPhone(user.countryCode, user.phone)],
      ['Email', user.email],
    ],
    emergency: [
      ['Name', ec?.name],
      ['Mobile', ec?.phone ? formatPhone(ec.countryCode || '91', ec.phone) : null],
    ],
  };

  return (
    <section className="panel overflow-hidden" aria-labelledby="profile-title">
      {/* Header: who you are and how complete the profile is */}
      <div className="flex flex-wrap items-center gap-4 border-b border-line bg-gradient-to-r from-marigold-wash to-white p-5">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-ink font-display text-xl text-marigold" aria-hidden>
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 id="profile-title" className="truncate text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-ink-soft">
            <span className="pill-quiet mr-2 bg-white">{ROLE_LABELS[user.role]}</span>
            {formatPhone(user.countryCode, user.phone)}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Profile {pct}% complete</span>
            {pct === 100 && <CheckCircle2 size={18} className="text-tulsi" aria-label="Complete" />}
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
            <div className={`h-full rounded-full ${pct === 100 ? 'bg-tulsi' : 'bg-marigold'}`} style={{ width: `${pct}%` }} />
          </div>
          {missing.length > 0 && !group && (
            <button type="button" className="mt-1 text-sm font-semibold text-ink underline-offset-2 hover:underline" onClick={() => open(missing[0].group)}>
              Next: add your {missing[0].label.toLowerCase()} →
            </button>
          )}
        </div>
      </div>

      {saved && <Notice tone="success" className="mx-5 mt-4">{saved}</Notice>}

      {!group ? (
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {Object.entries(GROUPS).map(([key, g]) => (
            <div key={key} className="rounded-xl border border-line p-4">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold"><g.icon size={18} className="text-marigold-deep" aria-hidden /> {g.label}</h2>
                <button type="button" className="flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-ink-soft hover:bg-mist hover:text-ink" onClick={() => open(key)} aria-label={`Edit ${g.label.toLowerCase()} details`}>
                  <Pencil size={14} aria-hidden /> Edit
                </button>
              </div>
              <dl className="divide-y divide-line">
                {cards[key].map(([k, v]) => <Fact key={k} label={k} value={v} />)}
              </dl>
              {key === 'emergency' && !ec?.phone && <p className="mt-2 text-sm text-ink-soft">Someone not travelling with you, so volunteers can reach your family.</p>}
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={save} noValidate className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl bg-mist p-1" role="tablist" aria-label="Profile section">
              {Object.entries(GROUPS).map(([key, g]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={group === key}
                  className={`flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${group === key ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
                  onClick={() => { setGroup(key); setError(''); setTried(false); }}
                >
                  <g.icon size={16} aria-hidden /> <span className="hidden sm:inline">{g.label}</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost min-h-10 px-3" onClick={close} aria-label="Close without saving"><X size={18} aria-hidden /></button>
          </div>
          <Notice tone="error">{error}</Notice>

          {group === 'personal' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="p-name" label="Full name" rule="personName" required value={form.name} onChange={put('name')} showErrors={tried} autoComplete="name" />
              <div>
                <label className="field-label" htmlFor="p-dob">Date of birth <span className="font-normal text-ink-soft">(optional)</span></label>
                <input
                  id="p-dob"
                  type="date"
                  className={`field ${dobError ? 'border-kumkum' : ''}`}
                  min={earliestDob()}
                  max={latestDob()}
                  value={form.dateOfBirth}
                  onChange={(e) => put('dateOfBirth')(e.target.value)}
                  aria-invalid={!!dobError}
                  aria-describedby="p-dob-help"
                />
                <p id="p-dob-help" className={`mt-1 text-sm ${dobError ? 'font-semibold text-kumkum' : 'text-ink-soft'}`}>
                  {dobError || (dobAge !== null ? `Age ${dobAge}` : `You must be ${MIN_AGE} or older.`)}
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="p-gender">Gender <span className="font-normal text-ink-soft">(optional)</span></label>
                <select id="p-gender" className="field" value={form.gender} onChange={(e) => put('gender')(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <TextField id="p-city" label="City / town" rule="city" value={form.city} onChange={put('city')} showErrors={tried} autoComplete="address-level2" />
            </div>
          )}

          {group === 'contact' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="field-label">Mobile number</p>
                <p className="field flex items-center bg-mist text-ink-soft">{formatPhone(user.countryCode, user.phone)}</p>
                <p className="mt-1 text-sm text-ink-soft">This is your login and can't be changed here.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="p-email">Email <span className="font-normal text-ink-soft">(optional)</span></label>
                <input
                  id="p-email"
                  type="email"
                  autoComplete="email"
                  className={`field ${tried && emailError(form.email) ? 'border-kumkum' : ''}`}
                  maxLength={120}
                  placeholder="name@gmail.com"
                  value={form.email}
                  onChange={(e) => put('email')(e.target.value.replace(/\s/g, ''))}
                  aria-describedby="p-email-help"
                />
                <p id="p-email-help" className={`mt-1 text-sm ${tried && emailError(form.email) ? 'font-semibold text-kumkum' : 'text-ink-soft'}`}>
                  {(tried && emailError(form.email)) || 'For booking receipts. Leave empty to remove.'}
                </p>
              </div>
            </div>
          )}

          {group === 'emergency' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="p-ec-name" label="Contact name" rule={{ min: 2, max: 60, kind: 'name' }} value={form.ecName} onChange={put('ecName')} showErrors={tried} placeholder="e.g. Sunita Patil (sister)" />
              <PhoneField
                id="p-ec-phone"
                label="Contact mobile"
                required={!!form.ecName.trim()}
                showErrors={tried}
                countryCode={form.ecCountryCode}
                phone={form.ecPhone}
                onChange={({ countryCode, phone }) => setForm((f) => ({ ...f, ecCountryCode: countryCode, ecPhone: phone }))}
              />
              <p className="text-sm text-ink-soft sm:col-span-2">Choose someone who is not travelling with you. Clear both fields to remove the contact.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={busy || (group === 'personal' && !!dobError)}>{busy ? 'Saving…' : `Save ${GROUPS[group].label.toLowerCase()} details`}</button>
            <button type="button" className="btn-ghost" onClick={close}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

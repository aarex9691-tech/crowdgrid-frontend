import { useState } from 'react';
import { Pencil } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { ROLE_LABELS, useAuth } from '../lib/auth';
import { formatPhone } from '../lib/phone';
import Notice from './Notice';

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

/** Profile card with an "Edit profile" form (email, date of birth, gender, city, emergency contact). */
export default function ProfilePanel() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = () => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      dateOfBirth: isoDay(user.dateOfBirth),
      gender: user.gender || '',
      city: user.city || '',
      ecName: user.emergencyContact?.name || '',
      ecPhone: user.emergencyContact?.phone || '',
    });
    setSaved(false);
    setError('');
    setEditing(true);
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const dobAge = form?.dateOfBirth ? ageFrom(form.dateOfBirth) : null;
  const dobError = form?.dateOfBirth && (dobAge === null || dobAge < MIN_AGE)
    ? `You must be at least ${MIN_AGE} years old. Choose a date on or before ${new Date(`${latestDob()}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}.`
    : '';

  const save = async (e) => {
    e.preventDefault();
    if (dobError) {
      setError(dobError);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await API.patch('/auth/me', {
        name: form.name,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        city: form.city,
        emergencyContact: { name: form.ecName, phone: form.ecPhone },
      });
      await refresh();
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const age = ageFrom(user.dateOfBirth);
  const facts = [
    ['Mobile', formatPhone(user.countryCode, user.phone)],
    ['Email', user.email],
    ['Age', age !== null ? `${age} years` : null],
    ['Gender', GENDERS[user.gender]],
    ['City', user.city],
    ['Emergency contact', user.emergencyContact?.phone && `${user.emergencyContact.name || ''} ${user.emergencyContact.phone}`.trim()],
  ];

  if (editing) {
    return (
      <form onSubmit={save} className="panel space-y-4 p-5">
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <Notice tone="error">{error}</Notice>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="p-name">Full name</label>
            <input id="p-name" className="field" maxLength={80} value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="field-label" htmlFor="p-email">Email (optional)</label>
            <input id="p-email" type="email" className="field" maxLength={120} value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-dob">Date of birth</label>
            <input
              id="p-dob"
              type="date"
              className={`field ${dobError ? 'border-kumkum' : ''}`}
              min={earliestDob()}
              max={latestDob()}
              value={form.dateOfBirth}
              onChange={set('dateOfBirth')}
              aria-invalid={!!dobError}
              aria-describedby="p-dob-help"
            />
            <p id="p-dob-help" className={`mt-1 text-sm ${dobError ? 'font-semibold text-kumkum' : 'text-ink-soft'}`}>
              {dobError || (dobAge !== null ? `Age ${dobAge}` : `You must be ${MIN_AGE} or older.`)}
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="p-gender">Gender</label>
            <select id="p-gender" className="field" value={form.gender} onChange={set('gender')}>
              <option value="">Prefer not to say</option>
              {Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="p-city">City / town</label>
            <input id="p-city" className="field" maxLength={60} value={form.city} onChange={set('city')} />
          </div>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="field-label">Emergency contact (someone not travelling with you)</legend>
          <input className="field" aria-label="Emergency contact name" placeholder="Name" maxLength={60} value={form.ecName} onChange={set('ecName')} />
          <input
            className="field"
            aria-label="Emergency contact number"
            placeholder="10-digit number"
            inputMode="tel"
            maxLength={10}
            value={form.ecPhone}
            onChange={(e) => setForm({ ...form, ecPhone: e.target.value.replace(/\D/g, '') })}
          />
        </fieldset>
        <p className="text-sm text-ink-soft">Leave a field empty to remove it. Your mobile number can't be changed here.</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={busy || !!dobError}>{busy ? 'Saving…' : 'Save profile'}</button>
          <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <span className="pill-quiet mt-1">{ROLE_LABELS[user.role]}</span>
        </div>
        <button type="button" className="btn-ghost min-h-10" onClick={open}>
          <Pencil size={16} aria-hidden /> Edit profile
        </button>
      </div>
      {saved && <Notice tone="success" className="mt-3">Profile saved.</Notice>}
      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {facts.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-36 shrink-0 text-ink-soft">{k}</dt>
            <dd className={v ? 'font-medium' : 'text-ink-faint'}>{v || 'Not added'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

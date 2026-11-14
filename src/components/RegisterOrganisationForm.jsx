import { useEffect, useState } from 'react';
import API, { errorMessage } from '../lib/api';
import Notice from './Notice';
import { TextField } from './Fields';
import { firstError, textError } from '../lib/validate';

export const PROVIDER_STATUS = {
  PENDING: ['pill-low', 'Waiting for the District Control Room'],
  VERIFIED: ['pill-ok', 'Verified'],
  REJECTED: ['pill-out', 'Not verified'],
};

/** An NGO, seva trust or ashram asks to run camps and kitchens at a yatra. The District Control Room verifies it. */
export default function RegisterOrganisationForm({ onDone }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'NGO', eventId: '', registrationNumber: '', description: '' });
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    API.get('/events', { params: { kind: 'YATRA' } })
      .then(({ data }) => {
        setEvents(data);
        setForm((f) => ({ ...f, eventId: data[0]?._id || '' }));
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTried(true);
    const problem = firstError(
      textError(form.name, 'Organisation name', 'orgName', { required: true }),
      form.eventId ? '' : 'Choose the yatra you will serve at',
      textError(form.registrationNumber, 'Registration number', 'regNumber'),
      textError(form.description, "What you'll provide", 'longText'),
    );
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await API.post('/providers/apply', form);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="panel space-y-4 p-5" data-no-translate>
      <h2 className="text-2xl font-bold">Register your NGO or seva trust</h2>
      <p className="text-ink-soft">The District Control Room verifies your organisation. Once verified, you can list camps and kitchens for pilgrims.</p>
      <Notice tone="error">{error}</Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id="o-name" label="Organisation name" rule="orgName" required value={form.name} onChange={put('name')} showErrors={tried} placeholder="e.g. Shri Ram Seva Trust" />
        <div>
          <label className="field-label" htmlFor="o-type">Type</label>
          <select id="o-type" className="field" value={form.type} onChange={set('type')}>
            <option value="NGO">NGO</option>
            <option value="TRUST">Seva trust</option>
            <option value="ASHRAM">Ashram</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="o-event">Yatra you will serve at</label>
          <select id="o-event" className="field" value={form.eventId} onChange={set('eventId')}>
            {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
        <TextField id="o-reg" label="Registration number" rule="regNumber" value={form.registrationNumber} onChange={(x) => put('registrationNumber')(x.toUpperCase())} showErrors={tried} placeholder="e.g. MH/2019/0012345" />
      </div>
      <TextField id="o-desc" label="What you'll provide" rule="longText" multiline rows={2} value={form.description} onChange={put('description')} showErrors={tried} placeholder="e.g. 200 beds in family tents and two langar kitchens" />
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send for verification'}</button>
    </form>
  );
}

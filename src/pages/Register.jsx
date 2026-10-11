import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import Notice from '../components/Notice';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Password must be at least 8 characters and include a letter and a number');
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell flex justify-center py-10">
      <form onSubmit={submit} className="panel w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-ink-soft">Book shelter, claim langar tokens and keep every pass in one place.</p>
        </div>
        <Notice tone="error">{error}</Notice>
        <div>
          <label htmlFor="name" className="field-label">Full name</label>
          <input id="name" className="field" autoComplete="name" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Mobile number</label>
          <input id="phone" className="field" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} required />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input id="password" type="password" className="field" autoComplete="new-password" minLength={8} value={form.password} onChange={set('password')} required />
          <p className="mt-1 text-sm text-ink-soft">At least 8 characters, with a letter and a number.</p>
        </div>
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-sm text-ink-soft">
          Running a camp or kitchen? Create an account first, then register your organisation from your profile.
        </p>
        <p className="text-center text-ink-soft">
          Already registered? <Link to="/login" className="font-semibold text-ink underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}

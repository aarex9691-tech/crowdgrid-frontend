import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import Notice from '../components/Notice';
import PhoneField from '../components/PhoneField';
import PasswordField from '../components/PasswordField';
import { phoneError } from '../lib/phone';
import { TextField } from '../components/Fields';
import { textError } from '../lib/validate';
import AuthShell from '../components/AuthShell';
import { useCelebrate } from '../components/SuccessSplash';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', countryCode: '91', phone: '', password: '' });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const celebrate = useCelebrate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTried(true);
    const nErr = textError(form.name, 'Full name', 'personName', { required: true });
    if (nErr) return setError(nErr);
    const pErr = phoneError(form.countryCode, form.phone);
    if (pErr) {
      setPhoneTouched(true);
      setError(pErr);
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Password must be at least 8 characters and include a letter and a number');
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, phone: form.phone.replace(/\D/g, '') });
      // Return to where the visitor came from (e.g. an invitation link)
      const first = form.name.trim().split(/\s+/)[0];
      celebrate({
        title: 'Account created',
        line: first ? `Welcome to CrowdGrid, ${first}.` : 'Welcome to CrowdGrid.',
        then: () => navigate(location.state?.from || '/', { replace: true }),
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={submit} noValidate className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-4xl sm:text-5xl">Create your account</h1>
          <p className="mt-2 text-ink-soft">One account for passes, stays, meals and rides at every event.</p>
        </div>
        <Notice tone="error">{error}</Notice>
        <TextField id="name" label="Full name" rule="personName" required autoComplete="name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} showErrors={tried} placeholder="As on your ID card" />
        <PhoneField
          countryCode={form.countryCode}
          phone={form.phone}
          touched={phoneTouched}
          onBlur={() => setPhoneTouched(true)}
          onChange={(v) => setForm({ ...form, ...v })}
        />
        <PasswordField
          id="password"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={set('password')}
          hint="At least 8 characters, with a letter and a number."
        />
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-sm text-ink-soft">
          Running a camp or kitchen? Create an account first, then register your organisation from your profile.
        </p>
        <p className="text-center text-ink-soft">
          Already registered? <Link to="/login" state={location.state} className="font-semibold text-blue underline underline-offset-4">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../lib/api';
import { afterLogin, useAuth } from '../lib/auth';
import Notice from '../components/Notice';
import PasswordField from '../components/PasswordField';
import { COUNTRIES, countryFor, phoneError } from '../lib/phone';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const bad = phoneError(countryCode, identifier);
    if (bad) return setError(bad);
    setBusy(true);
    try {
      const user = await login(identifier, password, countryCode);
      // a page left over from someone else's session (e.g. /control) must not trap this role
      navigate(afterLogin(user.role, location.state?.from), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={submit} className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-4xl sm:text-5xl">Log in</h1>
          <p className="mt-2 text-ink-soft">Use the mobile number you registered with.</p>
        </div>
        <Notice tone="error">{error}</Notice>
        <div>
          <label htmlFor="identifier" className="field-label">Mobile number</label>
          <div className="flex gap-2">
            <label htmlFor="login-cc" className="sr-only">Country code</label>
            <select id="login-cc" className="field w-36 shrink-0" value={countryCode} onChange={(e) => { setCountryCode(e.target.value); setIdentifier((v) => v.slice(0, countryFor(e.target.value).max)); }}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>+{c.code} {c.name}</option>
              ))}
            </select>
            <input
              id="identifier"
              className="field"
              inputMode="numeric"
              autoComplete="username"
              placeholder={`${countryFor(countryCode).max}-digit mobile number`}
              value={identifier}
              // digits only: the country code is chosen on the left (a pasted "+91 98765 43210" becomes 9876543210)
              onChange={(e) => {
                const max = countryFor(countryCode).max;
                let d = e.target.value.replace(/\D/g, '');
                if (d.length > max && d.startsWith(countryCode)) d = d.slice(countryCode.length);
                setIdentifier(d.slice(0, max));
              }}
              required
            />
          </div>
        </div>
        <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-ink-soft">
          New here? <Link to="/register" state={location.state} className="font-semibold text-blue underline underline-offset-4">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

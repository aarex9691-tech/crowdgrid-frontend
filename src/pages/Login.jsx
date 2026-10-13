import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../lib/api';
import { homeFor, useAuth } from '../lib/auth';
import Notice from '../components/Notice';
import PasswordField from '../components/PasswordField';
import { COUNTRIES } from '../lib/phone';

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
    setBusy(true);
    try {
      const user = await login(identifier, password, countryCode);
      navigate(location.state?.from || homeFor(user.role), { replace: true });
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
          <h1 className="text-3xl font-bold">Log in</h1>
          <p className="text-ink-soft">Use the mobile number you registered with.</p>
        </div>
        <Notice tone="error">{error}</Notice>
        <div>
          <label htmlFor="identifier" className="field-label">Mobile number</label>
          <div className="flex gap-2">
            <label htmlFor="login-cc" className="sr-only">Country code</label>
            <select id="login-cc" className="field w-36 shrink-0" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>+{c.code} {c.name}</option>
              ))}
            </select>
            <input
              id="identifier"
              className="field"
              inputMode="tel"
              autoComplete="username"
              placeholder="Mobile number"
              maxLength={20}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
        </div>
        <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-ink-soft">
          New here? <Link to="/register" state={location.state} className="font-semibold text-ink underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

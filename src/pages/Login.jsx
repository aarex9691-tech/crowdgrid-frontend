import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../lib/api';
import { afterLogin, useAuth } from '../lib/auth';
import Notice from '../components/Notice';
import PasswordField from '../components/PasswordField';
import { COUNTRIES, countryFor, phoneError } from '../lib/phone';
import { emailError } from '../lib/validate';
import AuthShell from '../components/AuthShell';
import { useCelebrate } from '../components/SuccessSplash';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [by, setBy] = useState('mobile'); // log in with the mobile number, or the email added in the profile
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const celebrate = useCelebrate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const bad = by === 'email' ? (email.trim() ? emailError(email) : 'Enter your email') : phoneError(countryCode, identifier);
    if (bad) return setError(bad);
    setBusy(true);
    try {
      const user = await login(by === 'email' ? email.trim() : identifier, password, countryCode);
      // a temporary password from the help desk must be replaced first
      if (user.mustChangePassword) return navigate('/set-password', { replace: true, state: { from: location.state?.from } });
      // a page left over from someone else's session (e.g. /control) must not trap this role
      const first = (user.name || '').trim().split(/\s+/)[0];
      celebrate({
        title: first ? `Welcome back, ${first}` : 'Welcome back',
        line: 'You are logged in.',
        then: () => navigate(afterLogin(user.role, location.state?.from), { replace: true }),
      });
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
          <p className="mt-2 text-ink-soft">Use the mobile number you registered with, or the email in your profile.</p>
        </div>
        <Notice tone="error">{error}</Notice>
        <div role="radiogroup" aria-label="Log in with" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-sand p-1">
          {[
            ['mobile', 'Mobile number'],
            ['email', 'Email'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={by === key}
              className={`min-h-11 rounded-lg px-3 font-semibold transition-colors ${by === key ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
              onClick={() => {
                setBy(key);
                setError('');
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {by === 'email' ? (
          <div>
            <label htmlFor="login-email" className="field-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="field"
              autoComplete="username email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={120}
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
              aria-describedby="login-email-help"
              required
            />
            <p id="login-email-help" className="mt-1 text-sm text-ink-soft">Works once you have added an email in My account. New accounts sign up with a mobile number.</p>
          </div>
        ) : (
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
        )}
        <div>
          <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="mt-2 min-h-11 text-base font-semibold text-ink-soft underline hover:text-ink" aria-expanded={forgot} aria-controls="forgot-help" onClick={() => setForgot((f) => !f)}>
            Forgot password?
          </button>
          {forgot && (
            <div id="forgot-help" className="mt-1 rounded-xl border border-line bg-sand p-4 text-[15px]">
              <p className="font-semibold">Visit any CrowdGrid help desk with an ID card.</p>
              <p className="mt-1 text-ink-soft">
                Staff will check your ID and give you a temporary password. Log in with it, then choose your own. Help desks are at the camp offices and the control room.
              </p>
            </div>
          )}
        </div>
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

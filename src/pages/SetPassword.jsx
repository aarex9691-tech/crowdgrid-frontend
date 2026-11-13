import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { errorMessage } from '../lib/api';
import { afterLogin, useAuth } from '../lib/auth';
import Notice from '../components/Notice';
import PasswordField from '../components/PasswordField';

const strongEnough = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

/**
 * Set a new password. Required after a help desk reset (the person logs in with the
 * temporary password and lands here); also reachable from My account at any time.
 */
export default function SetPassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace state={{ from: '/set-password' }} />;
  const forced = !!user.mustChangePassword;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!current) return setError(forced ? 'Enter the temporary password from the help desk' : 'Enter your current password');
    if (!strongEnough(next)) return setError('The new password needs at least 8 characters, with a letter and a number');
    if (next !== again) return setError('The two new passwords are not the same');
    if (next === current) return setError('Choose a new password, not the one you have now');
    setBusy(true);
    try {
      const u = await changePassword(current, next);
      navigate(forced ? afterLogin(u.role, location.state?.from) : '/account', { replace: true, state: { saved: 'Password changed. Other devices have been logged out.' } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell flex justify-center py-10">
      <form onSubmit={submit} noValidate className="panel w-full max-w-md space-y-5 p-6 sm:p-8">
        <div>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-marigold-wash text-marigold-deep" aria-hidden>
            <KeyRound size={24} />
          </span>
          <h1 className="text-3xl font-bold">{forced ? 'Set your own password' : 'Change password'}</h1>
          <p className="text-ink-soft" data-no-translate>
            {forced
              ? `Welcome back, ${user.name.split(' ')[0]}. You logged in with a temporary password from the help desk. Choose your own to continue.`
              : 'Your other phones and computers will be logged out.'}
          </p>
        </div>
        <Notice tone="error">{error}</Notice>
        <PasswordField
          id="current-password"
          label={forced ? 'Temporary password' : 'Current password'}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          hint={forced ? 'Type it exactly as given, for example KTRM-4827.' : undefined}
        />
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          hint="At least 8 characters, with a letter and a number."
        />
        <PasswordField id="new-password-again" label="Type the new password again" autoComplete="new-password" minLength={8} value={again} onChange={(e) => setAgain(e.target.value)} />
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}

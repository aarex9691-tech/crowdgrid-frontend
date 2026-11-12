import { useState } from 'react';
import { Copy, KeyRound, LockKeyhole, Search, UserRound } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { ROLE_LABELS } from '../../lib/auth';
import { useConfirm } from '../../lib/confirm';
import { phoneError } from '../../lib/phone';
import Notice from '../../components/Notice';
import PhoneField from '../../components/PhoneField';

/**
 * Help desk: a pilgrim who forgot their password comes with an ID. Staff find the account by
 * mobile number, check the name against the ID, and give a temporary password. The pilgrim
 * must set their own password at the next login, and every device they were on is logged out.
 */
export default function HelpDesk() {
  const confirm = useConfirm();
  const [mobile, setMobile] = useState({ countryCode: '91', phone: '' });
  const [account, setAccount] = useState(null);
  const [given, setGiven] = useState(null); // { tempPassword, message }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tried, setTried] = useState(false);

  const find = async (e) => {
    e.preventDefault();
    setTried(true);
    setError('');
    setAccount(null);
    setGiven(null);
    const bad = phoneError(mobile.countryCode, mobile.phone);
    if (bad) return setError(bad);
    setBusy(true);
    try {
      const { data } = await API.get('/admin/accounts/lookup', { params: mobile });
      setAccount(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    const ok = await confirm({
      title: `Reset the password of ${account.name}?`,
      message: 'Only do this after checking their ID. They will be logged out everywhere and must set a new password at the next login.',
      confirmLabel: 'Give temporary password',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await API.post(`/admin/accounts/${account._id}/reset-password`);
      setGiven(data);
      setAccount(data.account);
      setCopied(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(given.tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="shell max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Help desk</h1>
        <p className="text-ink-soft">Reset a pilgrim's forgotten password. Ask for an ID first and check that the name matches.</p>
      </div>

      <form onSubmit={find} noValidate className="panel space-y-4 p-5">
        <PhoneField id="desk-phone" label="Pilgrim's mobile number" countryCode={mobile.countryCode} phone={mobile.phone} onChange={(v) => setMobile(v)} showErrors={tried} />
        <button type="submit" className="btn-ink w-full sm:w-auto" disabled={busy}>
          <Search size={18} aria-hidden /> {busy && !account ? 'Finding…' : 'Find account'}
        </button>
      </form>

      <Notice tone="error">{error}</Notice>

      {account && (
        <section className="panel p-5" aria-labelledby="desk-account">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-sand text-ink-soft" aria-hidden>
              <UserRound size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="desk-account" className="text-xl font-bold">{account.name}</h2>
              <p className="text-ink-soft">
                {ROLE_LABELS[account.role] || account.role} · <span className="tabular-nums">{account.phone}</span>
                {account.city ? ` · ${account.city}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {account.locked && <span className="pill-out"><LockKeyhole size={14} aria-hidden /> Locked after wrong passwords</span>}
                {account.waitingForNewPassword && <span className="pill-low">Has a temporary password, not changed yet</span>}
              </div>
            </div>
          </div>
          {account.canReset ? (
            <button type="button" className="btn-primary mt-4 w-full sm:w-auto" onClick={reset} disabled={busy}>
              <KeyRound size={18} aria-hidden /> {busy ? 'Resetting…' : 'Give a temporary password'}
            </button>
          ) : (
            <Notice>{account.reason}</Notice>
          )}
        </section>
      )}

      {given && (
        <section className="rounded-3xl bg-tulsi p-6 text-white" role="status" aria-live="polite">
          <p className="text-sm font-semibold opacity-90">Temporary password</p>
          <p className="mt-1 font-mono text-4xl font-extrabold tracking-[0.15em]">{given.tempPassword}</p>
          <button type="button" onClick={copy} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/20 px-3 text-sm font-semibold hover:bg-white/30">
            <Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy'}
          </button>
          <p className="mt-4">{given.message}</p>
          <p className="mt-2 text-sm opacity-90">Read it out or write it down for them. It is shown only once and is not sent anywhere.</p>
        </section>
      )}
    </div>
  );
}

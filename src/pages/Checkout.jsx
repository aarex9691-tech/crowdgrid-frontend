import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, Lock, ShoppingCart, Smartphone, Trash2 } from 'lucide-react';
import API, { errorMessage } from '../lib/api';
import { rupees, useCart } from '../lib/cart';
import { cachePass } from '../lib/passCache';
import Notice from '../components/Notice';
import PassCard from '../components/PassCard';

const cardDigits = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const expiryFmt = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function CartStep({ onContinue, busy }) {
  const cart = useCart();
  if (cart.count === 0) {
    return (
      <div className="panel space-y-3 p-6 text-center">
        <ShoppingCart className="mx-auto text-ink-soft" size={40} aria-hidden />
        <p className="text-lg font-semibold">Your cart is empty</p>
        <p className="text-ink-soft">Paid camps and bus passes appear here. Free services are booked straight away.</p>
        <Link to="/yatra/simhastha-kumbh-2027" className="btn-primary">Browse services</Link>
      </div>
    );
  }
  return (
    <div className="panel p-5">
      <ul className="divide-y divide-line">
        {cart.items.map((i) => (
          <li key={i.key} className="flex items-start gap-3 py-3">
            <div className="flex-1">
              <p className="font-bold">{i.label}</p>
              <p className="text-ink-soft">{i.detail}</p>
            </div>
            <p className="font-semibold tabular-nums">{rupees(i.estimate)}</p>
            <button type="button" className="text-ink-soft hover:text-kumkum" aria-label={`Remove ${i.label}`} onClick={() => cart.remove(i.key)}>
              <Trash2 size={20} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-lg">
        <span className="font-semibold">Estimated total</span>
        <span className="font-bold tabular-nums">{rupees(cart.total)}</span>
      </div>
      <button type="button" className="btn-primary mt-4 w-full text-lg" disabled={busy} onClick={onContinue}>
        {busy ? 'Checking prices and availability…' : 'Continue to payment'}
      </button>
    </div>
  );
}

function PayStep({ order, onPaid, onBack }) {
  const [method, setMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = method === 'UPI' ? { method, upiId } : { method, cardNumber: card.number, expiry: card.expiry, cvv: card.cvv };
      const { data } = await API.post(`/orders/${order._id}/pay`, body);
      onPaid(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={pay} className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-lg font-bold">Order summary</h2>
        <ul className="mt-2 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i._id} className="flex justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{i.label}</span>
                <span className="block text-sm text-ink-soft">{i.detail}</span>
              </span>
              <span className="font-semibold tabular-nums">{rupees(i.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-line pt-3 text-xl font-bold">
          <span>To pay</span>
          <span className="tabular-nums">{rupees(order.total)}</span>
        </div>
      </div>

      <div className="panel space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
          {[
            { id: 'UPI', label: 'UPI', icon: Smartphone },
            { id: 'CARD', label: 'Debit / credit card', icon: CreditCard },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border font-semibold ${
                method === m.id ? 'border-marigold bg-marigold-wash text-ink' : 'border-line bg-white text-ink-soft'
              }`}
            >
              <m.icon size={20} aria-hidden /> {m.label}
            </button>
          ))}
        </div>

        {method === 'UPI' ? (
          <div>
            <label htmlFor="upi" className="field-label">UPI ID</label>
            <input id="upi" className="field" placeholder="name@okaxis" autoComplete="off" value={upiId} onChange={(e) => setUpiId(e.target.value.trim())} required />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem_6rem]">
            <div>
              <label htmlFor="cardno" className="field-label">Card number</label>
              <input id="cardno" className="field tabular-nums" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: cardDigits(e.target.value) })} required />
            </div>
            <div>
              <label htmlFor="exp" className="field-label">Expiry</label>
              <input id="exp" className="field tabular-nums" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: expiryFmt(e.target.value) })} required />
            </div>
            <div>
              <label htmlFor="cvv" className="field-label">CVV</label>
              <input id="cvv" type="password" className="field tabular-nums" inputMode="numeric" autoComplete="cc-csc" maxLength={3} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} required />
            </div>
          </div>
        )}

        <p className="rounded-xl bg-mist p-3 text-sm text-ink-soft">
          <b>Demo mode, no real money.</b>{' '}
          {method === 'UPI' ? 'Any UPI ID like ramesh@okaxis is approved; fail@upi is declined.' : 'Card 4242 4242 4242 4242 is approved; 4000 0000 0000 0002 is declined. Any future expiry and any 3-digit CVV.'}
        </p>
        <Notice tone="error">{error}</Notice>
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          <Lock size={18} aria-hidden /> {busy ? 'Processing payment…' : `Pay ${rupees(order.total)}`}
        </button>
        <button type="button" className="btn-ghost w-full" disabled={busy} onClick={onBack}>Back to cart</button>
      </div>
    </form>
  );
}

function Receipt({ order }) {
  const failed = order.items.filter((i) => i.status === 'FAILED');
  return (
    <div className="space-y-5">
      <div className="panel space-y-2 p-6">
        <p className="flex items-center gap-2 text-2xl font-bold text-tulsi">
          <CheckCircle2 size={28} aria-hidden /> Payment successful
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[15px]">
          <dt className="text-ink-soft">Amount</dt>
          <dd className="font-semibold">{rupees(order.total)}</dd>
          <dt className="text-ink-soft">Paid with</dt>
          <dd>{order.payment.method === 'UPI' ? 'UPI' : 'Card'} · {order.payment.account}</dd>
          <dt className="text-ink-soft">Reference</dt>
          <dd className="font-mono">{order.payment.reference}</dd>
        </dl>
        {failed.length > 0 && (
          <Notice tone="error">
            {failed.map((i) => `${i.label}: ${i.error}`).join(' · ')}. {rupees(order.refunded)} has been refunded to the same account.
          </Notice>
        )}
      </div>
      {order.passes.length > 0 && (
        <>
          <h2 className="text-xl font-bold">Your passes</h2>
          <ul className="space-y-4">
            {order.passes.map((p) => (
              <li key={p._id}><PassCard pass={p} /></li>
            ))}
          </ul>
        </>
      )}
      <Link to="/passbook" className="btn-ink">Open my passbook</Link>
    </div>
  );
}

export default function Checkout() {
  const cart = useCart();
  const [order, setOrder] = useState(null);
  const [paid, setPaid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const createOrder = async () => {
    setBusy(true);
    setError('');
    try {
      const items = cart.items.map(({ kind, refId, input, label }) => ({ kind, refId, input, label }));
      const { data } = await API.post('/orders', { items });
      setOrder(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onPaid = (data) => {
    data.passes.forEach(cachePass);
    cart.clear();
    setPaid(data);
  };

  return (
    <div className="shell max-w-2xl space-y-5 py-8">
      <div>
        <h1 className="text-3xl font-bold">{paid ? 'Booking complete' : order ? 'Payment' : 'Your cart'}</h1>
        {!paid && <p className="text-ink-soft">Pay once for all paid camps and bus passes. Your QR passes are issued right after payment.</p>}
      </div>
      <Notice tone="error">{error}</Notice>
      {paid ? <Receipt order={paid} /> : order ? <PayStep order={order} onPaid={onPaid} onBack={() => setOrder(null)} /> : <CartStep onContinue={createOrder} busy={busy} />}
    </div>
  );
}

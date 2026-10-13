import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Cart for paid items (paid camps, bus passes). Kept on this device only.
 * Prices shown here are estimates; the server prices every item again at checkout.
 */
const KEY = 'cg_cart';
const CartContext = createContext(null);

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const write = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage blocked: cart lives in memory for this visit */
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);

  const update = useCallback((fn) => {
    setItems((prev) => {
      const next = fn(prev);
      write(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      total: items.reduce((s, i) => s + (i.estimate || 0), 0),
      /** Adds an item; the same camp or route replaces its earlier line. */
      add: (item) => update((prev) => [...prev.filter((i) => i.key !== item.key), item].slice(-10)),
      remove: (key) => update((prev) => prev.filter((i) => i.key !== key)),
      clear: () => update(() => []),
    }),
    [items, update]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

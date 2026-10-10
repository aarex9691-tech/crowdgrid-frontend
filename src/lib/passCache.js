// Offline passbook: the last successful pass list is kept in localStorage so
// QR codes can still be shown near the ghats when the mobile network drops.
// QR images are drawn on the device from the signed payload, so no network is needed.
const KEY = 'cg_passes';

export const savePasses = (passes) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), passes }));
  } catch {
    /* storage full or blocked: passbook still works online */
  }
};

export const loadPasses = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
};

/** Adds or replaces one pass in the cache right after it is issued. */
export const cachePass = (pass) => {
  if (!pass) return;
  const cached = loadPasses();
  const list = (cached?.passes || []).filter((p) => p._id !== pass._id);
  savePasses([pass, ...list]);
};

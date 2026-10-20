// The current player's progress on this device, so a refresh can't re-roll the spin.
const KEY = "chs.session";

export const session = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} },
  patch(p) { const s = { ...(this.get() || {}), ...p }; this.set(s); return s; },
  clear() { try { localStorage.removeItem(KEY); } catch {} },
};

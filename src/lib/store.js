import cfg from "../config.js";

/*
 * Storage layer. Two interchangeable backends with the same async API:
 *   - LocalStore:    this browser only (localStorage)
 *   - SupabaseStore: shared across every device (REST, no SDK needed)
 */
  const normEmail = (e) => String(e || "").trim().toLowerCase();

  /* ---------- Device identity ----------
   * A random id kept in localStorage AND a long-lived cookie, so clearing one
   * of them is not enough to get a second spin on the same device. */
  const DEVICE_KEY = "chs.deviceId";
  const PLAYED_KEY = "chs.played";

  function readCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(".", "\\.") + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function writeCookie(name, value) {
    try {
      document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`;
    } catch {}
  }
  function clearCookie(name) {
    try { document.cookie = `${name}=; max-age=0; path=/`; } catch {}
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch {} }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

const Device = {
    id() {
      let id = lsGet(DEVICE_KEY) || readCookie("chs_device");
      if (!id) id = uuid();
      lsSet(DEVICE_KEY, id);
      writeCookie("chs_device", id);
      return id;
    },
    hasPlayed() {
      return !!(lsGet(PLAYED_KEY) || readCookie("chs_played"));
    },
    markPlayed(regId) {
      lsSet(PLAYED_KEY, regId || "1");
      writeCookie("chs_played", regId || "1");
    },
    reset() {
      lsDel(PLAYED_KEY); clearCookie("chs_played");
      lsDel(DEVICE_KEY); clearCookie("chs_device");
    },
  };

  /* ---------- Local backend ---------- */
  const REG_KEY = "chs.registrations";
  const STOCK_KEY = "chs.stock";

  let demoCode = null;
  const LocalStore = {
    mode: "local",
    // No email server in local mode: the code is shown on screen (demo only).
    async sendCode() {
      demoCode = String(Math.floor(100000 + Math.random() * 900000));
      return { demoCode };
    },
    async verifyCode(email, code) { return !!demoCode && code === demoCode; },
    _regs() { try { return JSON.parse(lsGet(REG_KEY)) || []; } catch { return []; } },
    _saveRegs(r) { lsSet(REG_KEY, JSON.stringify(r)); },
    _stock() {
      try {
        const s = JSON.parse(lsGet(STOCK_KEY));
        if (s) return s;
      } catch {}
      const s = { ...cfg.DEFAULT_STOCK };
      lsSet(STOCK_KEY, JSON.stringify(s));
      return s;
    },
    async findConflict({ email, deviceId }) {
      const e = normEmail(email);
      const regs = this._regs();
      if (regs.some((r) => r.email_norm === e)) return "email";
      if (regs.some((r) => r.device_id && r.device_id === deviceId)) return "device";
      return null;
    },
    async createRegistration({ name, email, deviceId }) {
      const regs = this._regs();
      const e = normEmail(email);
      if (regs.some((r) => r.email_norm === e)) throw Object.assign(new Error("dup"), { conflict: "email" });
      const reg = { id: uuid(), created_at: new Date().toISOString(), name, email: email.trim(), email_norm: e, device_id: deviceId, prize: "" };
      regs.unshift(reg);
      this._saveRegs(regs);
      return reg.id;
    },
    async setPrize(id, prize) {
      const regs = this._regs();
      const r = regs.find((x) => x.id === id);
      if (r && !r.prize) { r.prize = prize; this._saveRegs(regs); return true; }
      return false;
    },
    async adminLogin(pw) { return pw === cfg.ADMIN_PASSWORD; },
    async adminNeedsSetup() { return false; }, // local mode uses ADMIN_PASSWORD from config
    async adminSetup() { return false; },
    async listRegistrations() { return this._regs(); },
    async clearRegistrations() { this._saveRegs([]); },
    async jackpotClaimed() { return this._regs().some((r) => r.prize === cfg.JACKPOT_PRIZE); },
    async resetJackpot() {
      const regs = this._regs();
      regs.forEach((r) => { if (r.prize === cfg.JACKPOT_PRIZE) r.prize = ""; });
      this._saveRegs(regs);
    },
    async releaseDevice(deviceId) {
      const regs = this._regs();
      regs.forEach((r) => { if (r.device_id === deviceId) r.device_id = null; });
      this._saveRegs(regs);
    },
    async listStock() {
      const s = this._stock();
      return Object.keys(s).map((name) => ({ name, remaining: s[name] }));
    },
    async setStock(name, remaining) {
      const s = this._stock(); s[name] = remaining; lsSet(STOCK_KEY, JSON.stringify(s));
    },
    async decrementStock(name) {
      const s = this._stock();
      if ((s[name] || 0) > 0) { s[name] -= 1; lsSet(STOCK_KEY, JSON.stringify(s)); return true; }
      return false;
    },
  };

  /* ---------- Supabase backend (shared across devices) ----------
   * Tables are locked; everything goes through the functions in
   * supabase/schema.sql, so players can never read other players' emails. */
  function makeSupabaseStore(url, key) {
    const base = url.replace(/\/$/, "") + "/rest/v1/rpc/";
    const authBase = url.replace(/\/$/, "") + "/auth/v1/";
    const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    let adminPw = null;
    let userToken = null; // set once the player's email code is verified

    async function auth(path, body) {
      const res = await fetch(authBase + path, { method: "POST", headers, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.msg || data.error_description || data.message || res.statusText);
        err.status = res.status;
        err.code = data.error_code || data.code;
        throw err;
      }
      return data;
    }

    async function rpc(fn, args = {}) {
      const h = userToken ? { ...headers, Authorization: `Bearer ${userToken}` } : headers;
      const res = await fetch(base + fn, { method: "POST", headers: h, body: JSON.stringify(args) });
      if (!res.ok) {
        const body = await res.text();
        let msg = body;
        try { msg = JSON.parse(body).message || body; } catch {}
        const err = new Error(msg || res.statusText);
        err.status = res.status;
        if (res.status === 409) err.conflict = body.includes("device") ? "device" : "email";
        throw err;
      }
      return res.status === 204 ? null : res.json().catch(() => null);
    }

    return {
      mode: "shared",
      /** Email a 6-digit code (Supabase Auth one-time password). */
      async sendCode(email) {
        await auth("otp", { email: email.trim(), create_user: true });
        return {};
      },
      /** Check the code; on success the player's session is used to register. */
      async verifyCode(email, code) {
        try {
          const data = await auth("verify", { type: "email", email: email.trim(), token: code });
          userToken = data.access_token;
          return true;
        } catch (err) {
          if (err.status === 400 || err.status === 401 || err.status === 403) return false;
          throw err;
        }
      },
      async findConflict({ email, deviceId }) {
        return rpc("check_player", { p_email: email || "", p_device: deviceId || null });
      },
      async createRegistration({ name, email, deviceId }) {
        return rpc("register_player", { p_name: name, p_email: email, p_device: deviceId });
      },
      async setPrize(id, prize) {
        return rpc("set_prize", { p_id: id, p_prize: prize });
      },
      async jackpotClaimed() { return (await rpc("jackpot_claimed")) === true; },
      async listStock() { return rpc("list_stock"); },
      async decrementStock(name) { return (await rpc("decrement_stock", { prize_name: name })) === true; },

      // Admin — the password is checked by the database, then kept in memory only.
      async adminNeedsSetup() { return (await rpc("admin_password_set")) !== true; },
      /** One-time: works only while no admin password exists. */
      async adminSetup(pw) {
        const ok = (await rpc("admin_setup", { p_pw: pw })) === true;
        if (ok) adminPw = pw;
        return ok;
      },
      async adminLogin(pw) {
        const ok = (await rpc("is_admin", { p_pw: pw })) === true;
        adminPw = ok ? pw : null;
        return ok;
      },
      async listRegistrations() { return rpc("admin_list", { p_pw: adminPw }); },
      async clearRegistrations() { await rpc("admin_clear", { p_pw: adminPw }); },
      async resetJackpot() { await rpc("admin_reset_jackpot", { p_pw: adminPw }); },
      async releaseDevice(deviceId) { await rpc("admin_release_device", { p_pw: adminPw, p_device: deviceId }); },
      async setStock(name, remaining) { await rpc("admin_set_stock", { p_pw: adminPw, p_name: name, p_remaining: remaining }); },
    };
  }

const shared = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY;
export const store = shared ? makeSupabaseStore(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : LocalStore;
export { Device };

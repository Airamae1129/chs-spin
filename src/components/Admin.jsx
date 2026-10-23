import { useEffect, useState } from "react";
import cfg from "../config.js";
import { store, Device } from "../lib/store.js";
import { session } from "../lib/session.js";

function StockEditor() {
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await store.listStock();
    setRows(r);
    setDraft(Object.fromEntries(r.map((x) => [x.name, String(x.remaining)])));
  };
  useEffect(() => { load(); }, []);

  const save = async (name) => {
    const n = parseInt(draft[name], 10);
    if (Number.isNaN(n) || n < 0) return;
    setBusy(true);
    await store.setStock(name, n);
    setRows((rs) => rs.map((r) => (r.name === name ? { ...r, remaining: n } : r)));
    setBusy(false);
  };

  if (!rows) return <p className="mode-note">Loading stock…</p>;
  const max = Math.max(...rows.map((r) => cfg.DEFAULT_STOCK[r.name] || r.remaining), 1);
  return (
    <>
      <p className="eyebrow section-label">Prize stock</p>
      {rows.map((r) => (
        <div key={r.name} className="stock-row">
          <div>
            <b>{r.name}</b>
            <small>{r.remaining} left{r.remaining === 0 ? " — its topics are off the wheel" : ""}</small>
            <div className="bar"><i style={{ width: `${Math.min(100, (r.remaining / max) * 100)}%` }} /></div>
          </div>
          <div className="ctl">
            <input type="number" min="0" value={draft[r.name] ?? ""} aria-label={`${r.name} stock`}
              onChange={(e) => setDraft((d) => ({ ...d, [r.name]: e.target.value }))} />
            <button className="btn btn--ghost btn--sm" disabled={busy} onClick={() => save(r.name)}>Save</button>
          </div>
        </div>
      ))}
    </>
  );
}

export default function Admin() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [needsSetup, setNeedsSetup] = useState(null); // null = checking
  const [pw2, setPw2] = useState("");

  useEffect(() => {
    store.adminNeedsSetup().then(setNeedsSetup).catch(() => setNeedsSetup(false));
  }, []);

  const load = async () => {
    setBusy(true);
    try { setList(await store.listRegistrations()); }
    catch (e) { setNotice(`Could not load: ${e.message}`); }
    setBusy(false);
  };

  const login = async (e) => {
    e.preventDefault();
    let ok = false;
    try { ok = await store.adminLogin(pw); }
    catch (err) { return setError(`Could not reach the database: ${err.message}`); }
    if (!ok) return setError("Incorrect password.");
    setError("");
    setAuthed(true);
    await load();
  };

  // First visit only: create the admin password (the database refuses once one exists).
  const setup = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (pw !== pw2) return setError("The two passwords don’t match.");
    setBusy(true);
    let ok = false;
    try { ok = await store.adminSetup(pw); }
    catch (err) { setBusy(false); return setError(err.message || "Could not save the password."); }
    setBusy(false);
    if (!ok) {
      setNeedsSetup(false);
      setPw(""); setPw2("");
      return setError("An admin password already exists — log in with it.");
    }
    setError("");
    setNeedsSetup(false);
    setAuthed(true);
    setNotice("Admin password saved. Use it next time you log in.");
    await load();
  };

  const csv = () => {
    const rows = [["Name", "Email", "Time", "Prize"], ...list.map((r) => [r.name, r.email, r.created_at, r.prize])];
    const text = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "chs-spin-game-entries.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const resetDevice = async () => {
    const id = Device.id();
    try { await store.releaseDevice(id); } catch {}
    Device.reset();
    session.clear();
    setNotice("Play reset on this device — it can register and spin again (with a new email).");
  };

  const resetJackpot = async () => {
    if (!window.confirm("Reset the jackpot so it can be won again?")) return;
    setBusy(true);
    await store.resetJackpot();
    await load();
    setNotice("Jackpot reset — it can be won again.");
  };

  const clearAll = async () => {
    if (!window.confirm("Clear ALL registrations? This cannot be undone.")) return;
    setBusy(true);
    await store.clearRegistrations();
    await load();
    setNotice("All registrations cleared.");
  };

  const winners = list.filter((r) => r.prize).length;
  const jackpot = list.some((r) => r.prize === cfg.JACKPOT_PRIZE);

  return (
    <main className="shell shell--wide">
      <div className="admin-head">
        <h1>Admin <span className="badge">{store.mode === "shared" ? "All devices" : "This device"}</span></h1>
        <a href="/">← Back to game</a>
      </div>

      <div className="card">
        {!authed && needsSetup === null ? (
          <p>Loading…</p>
        ) : !authed && needsSetup ? (
          <form onSubmit={setup}>
            <span className="eyebrow">First-time setup</span>
            <h2>Create admin password</h2>
            <p style={{ marginBottom: 16 }}>
              No admin password exists yet. Choose one now (at least 8 characters). You’ll use it every time you open this page.
              This form only works once.
            </p>
            <div className="field">
              <input id="newpw" type="password" autoComplete="new-password" placeholder=" " value={pw} onChange={(e) => setPw(e.target.value)} style={{ paddingLeft: 16 }} />
              <label htmlFor="newpw" style={{ left: 16 }}>New admin password</label>
            </div>
            <div className="field">
              <input id="newpw2" type="password" autoComplete="new-password" placeholder=" " value={pw2} onChange={(e) => setPw2(e.target.value)} style={{ paddingLeft: 16 }} />
              <label htmlFor="newpw2" style={{ left: 16 }}>Confirm password</label>
            </div>
            <button className="btn" type="submit" disabled={busy}>{busy ? "Saving…" : "Save password & open admin"}</button>
            <p className="form-error">{error}</p>
          </form>
        ) : !authed ? (
          <form onSubmit={login}>
            <p style={{ marginBottom: 16 }}>Enter the admin password to view registered players.</p>
            <div className="field">
              <input id="pw" type="password" placeholder=" " value={pw} onChange={(e) => setPw(e.target.value)} style={{ paddingLeft: 16 }} />
              <label htmlFor="pw" style={{ left: 16 }}>Admin password</label>
            </div>
            <button className="btn" type="submit">View list</button>
            <p className="form-error">{error}</p>
          </form>
        ) : (
          <>
            <div className="stats">
              <div className="stat"><b>{list.length}</b><span>Players</span></div>
              <div className="stat"><b>{winners}</b><span>Winners</span></div>
              <div className="stat"><b>{jackpot ? "Won" : "Open"}</b><span>Jackpot</span></div>
            </div>

            <div className="reg-list">
              {list.length === 0 && <p>No entries yet.</p>}
              {list.map((r) => (
                <div key={r.id} className="reg">
                  <span className="av">{r.name?.[0]?.toUpperCase()}</span>
                  <div>
                    <div className="nm">{r.name}</div>
                    <div className="em">{r.email}</div>
                    <div className="tm">{new Date(r.created_at).toLocaleString()}</div>
                    {r.prize && <div className="pz">🎁 Won: {r.prize}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="btn-row">
              <button className="btn btn--ghost" onClick={csv} disabled={!list.length}>Download CSV</button>
              <button className="btn btn--ghost" onClick={load} disabled={busy}>Refresh</button>
              <button className="btn btn--ghost" onClick={resetDevice}>Reset play (this device)</button>
              <button className="btn btn--ghost" onClick={resetJackpot} disabled={busy}>Reset jackpot</button>
              <button className="btn btn--ghost btn--danger" onClick={clearAll} disabled={busy || !list.length}>Clear list</button>
            </div>
            <p className="notice">{notice}</p>

            <StockEditor />

            {store.mode === "local" && (
              <p className="mode-note">
                Running in local mode: entries are saved on this device only. To check emails across every
                phone, connect a shared database (see README).
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

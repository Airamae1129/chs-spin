import { useState } from "react";
import { Mail, User } from "./Icons.jsx";
import { emailError } from "../lib/validate.js";

export default function RegisterForm({ initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const fail = (msg) => { setError(msg); setShakeKey((k) => k + 1); };

  const submit = async (e) => {
    e.preventDefault();
    const n = name.trim();
    const m = email.trim();
    if (!n) return fail("Please enter your name.");
    const ee = emailError(m);
    if (ee) return fail(ee);
    setError("");
    setBusy(true);
    try {
      const msg = await onSubmit({ name: n, email: m });
      if (msg) fail(msg);
    } catch (err) {
      fail(err?.message || "Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} noValidate>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <span className="eyebrow">Enter to play</span>
      </div>
      <div className="field">
        <input id="name" type="text" placeholder=" " autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="name">Full name</label>
        <User className="ico" />
      </div>
      <div className="field">
        <input id="email" type="email" placeholder=" " autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="email">Email address</label>
        <Mail className="ico" />
      </div>
      <button className="btn" type="submit" disabled={busy} style={{ marginTop: 6 }}>
        {busy ? "Sending code…" : "Send my code"}
      </button>
      <p key={shakeKey} className={`form-error${error ? " shake" : ""}`} role="alert">{error}</p>
      <p className="fineprint">We’ll email you a 6-digit code to verify it’s you.<br />One spin per person · one spin per device</p>
    </form>
  );
}

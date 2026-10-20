import { useEffect, useRef, useState } from "react";
import { Mail } from "./Icons.jsx";

const LEN = 6;
const RESEND_AFTER = 60;

/** Six single-digit boxes: auto-advance, backspace, arrow keys and paste. */
export default function VerifyCode({ email, demoCode, onVerify, onResend, onBack }) {
  const [digits, setDigits] = useState(Array(LEN).fill(""));
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_AFTER);
  const [sentNote, setSentNote] = useState("");
  const boxes = useRef([]);

  useEffect(() => { boxes.current[0]?.focus(); }, []);
  // After a wrong code, put the cursor back in the first box once inputs are enabled again.
  useEffect(() => { if (!busy && error) boxes.current[0]?.focus(); }, [busy, error, shakeKey]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (code) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const msg = await onVerify(code);
      if (msg) {
        setError(msg);
        setShakeKey((k) => k + 1);
        setDigits(Array(LEN).fill(""));
      }
    } catch (err) {
      setError(err?.message || "Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fill = (start, chars) => {
    const next = [...digits];
    let i = start;
    for (const c of chars) {
      if (i >= LEN) break;
      next[i++] = c;
    }
    setDigits(next);
    boxes.current[Math.min(i, LEN - 1)]?.focus();
    if (next.every((d) => d)) submit(next.join(""));
  };

  const onChange = (i, v) => {
    const only = v.replace(/\D/g, "");
    if (!only) { const n = [...digits]; n[i] = ""; setDigits(n); return; }
    fill(i, only.split(""));
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const n = [...digits]; n[i - 1] = ""; setDigits(n);
      boxes.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) boxes.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, LEN);
    if (!t) return;
    e.preventDefault();
    fill(0, t.split(""));
  };

  const resend = async () => {
    setError("");
    setSentNote("");
    try {
      await onResend();
      setWait(RESEND_AFTER);
      setDigits(Array(LEN).fill(""));
      setSentNote("New code sent!");
      boxes.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Couldn’t resend the code.");
    }
  };

  return (
    <div className="card card--center verify">
      <div className="status-ico"><Mail style={{ width: 30, height: 30, color: "#B9802F" }} /></div>
      <span className="eyebrow">Check your inbox</span>
      <h2>Enter your 6-digit code</h2>
      <p>We sent a code to <b className="verify__email">{email}</b></p>

      {demoCode && (
        <div className="demo-code">
          <b>Demo mode</b> — email isn’t connected yet, so here’s the code: <code>{demoCode}</code>
        </div>
      )}

      <div key={shakeKey} className={`otp${error ? " shake" : ""}`} onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (boxes.current[i] = el)}
            className={`otp__box${d ? " filled" : ""}`}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LEN}
            value={d}
            disabled={busy}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>

      <button className="btn" disabled={busy || digits.some((d) => !d)} onClick={() => submit(digits.join(""))}>
        {busy ? "Checking…" : "Verify & play"}
      </button>
      <p className="form-error" role="alert">{error}</p>
      {sentNote && !error && <p className="notice" style={{ marginTop: 0 }}>{sentNote}</p>}

      <p className="fineprint">
        Didn’t get it? Check spam, or{" "}
        {wait > 0
          ? <span>resend in {wait}s</span>
          : <button className="link" style={{ padding: 0 }} onClick={resend}>resend code</button>}
        {" · "}
        <button className="link" style={{ padding: 0 }} onClick={onBack}>change email</button>
      </p>
    </div>
  );
}

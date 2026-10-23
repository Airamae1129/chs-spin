import { useEffect, useMemo, useRef, useState } from "react";
import cfg from "../config.js";
import { CATEGORIES } from "../data.js";
import { store, Device } from "../lib/store.js";
import { session } from "../lib/session.js";
import Hero from "./Hero.jsx";
import Modal from "./Modal.jsx";
import RegisterForm from "./RegisterForm.jsx";
import VerifyCode from "./VerifyCode.jsx";
import Instructions from "./Instructions.jsx";
import Question, { JackpotResult } from "./Question.jsx";
import Wheel, { layoutSegments } from "./Wheel.jsx";
import QRModal from "./QRModal.jsx";
import { sound } from "../lib/sound.js";
import { QR } from "./Icons.jsx";

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

function StatusCard({ icon, eyebrow, title, children }) {
  return (
    <div className="card card--center">
      <div className="status-ico">{icon}</div>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function Game() {
  // phase: loading | register | verify | blocked | wheel | done
  const [phase, setPhase] = useState("loading");
  const [blocked, setBlocked] = useState(null);       // "device" | "email"
  const [player, setPlayer] = useState(null);         // session object
  const [stock, setStock] = useState(null);
  const [jackpotTaken, setJackpotTaken] = useState(false);
  const [modal, setModal] = useState(null);           // "howto" | "question" | "qr"
  const [landed, setLanded] = useState(null);         // { cat, question }
  const [spun, setSpun] = useState(false);
  const [pending, setPending] = useState(null);       // { name, email, demoCode } while verifying
  const [draft, setDraft] = useState(null);           // form values kept for "change email"
  const wheel = useRef(null);

  /* ---------- Boot: decide where this device stands ---------- */
  useEffect(() => {
    (async () => {
      let s = session.get();
      // New event: if the admin cleared the list, this device's old entry is gone,
      // so forget the old lock and let it play again.
      if (Device.hasPlayed()) {
        try {
          const id = Device.playedId();
          if (id && !(await store.registrationExists(id))) {
            Device.reset();
            session.clear();
            s = null;
          }
        } catch {}
      }
      if (Device.hasPlayed()) {
        if (s && s.stage === "wheel") return enterWheel(s, false);
        if (s && s.stage === "question" && !s.answered) return resumeQuestion(s);
        setPlayer(s);
        setBlocked("device");
        return setPhase(s ? "done" : "blocked");
      }
      try {
        if (store.mode === "shared" && (await store.findConflict({ email: "", deviceId: Device.id() })) === "device") {
          setBlocked("device");
          return setPhase("blocked");
        }
      } catch {}
      setPhase("register");
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPrizes() {
    const [rows, jp] = await Promise.all([store.listStock(), store.jackpotClaimed()]);
    setStock(Object.fromEntries(rows.map((r) => [r.name, r.remaining])));
    setJackpotTaken(jp);
  }

  async function enterWheel(s, showHowTo) {
    setPlayer(s);
    setPhase("wheel");
    await loadPrizes();
    if (showHowTo) setModal("howto");
  }

  async function resumeQuestion(s) {
    const cat = CATEGORIES.find((c) => c.name === s.landed);
    setPlayer(s);
    setPhase("wheel");
    setSpun(true);
    await loadPrizes();
    if (!cat) return;
    setLanded({ cat, question: cat.questions?.[s.qIndex] });
    setModal("question");
  }

  /* ---------- Registration + email verification ---------- */
  const USED = "This email has already been used to play. Each email gets one spin.";

  function friendly(err) {
    if (err?.status === 429) return "Too many attempts — please wait a minute and try again.";
    return err?.message || "Something went wrong — please try again.";
  }

  // Step 1: check the email/device haven't played, then email a 6-digit code.
  async function startVerify({ name, email }) {
    const conflict = await store.findConflict({ email, deviceId: Device.id() });
    if (conflict === "email") return USED;
    if (conflict === "device") { setBlocked("device"); setPhase("blocked"); return; }
    try {
      const { demoCode } = await store.sendCode(email);
      setPending({ name, email, demoCode });
      setPhase("verify");
    } catch (err) {
      return friendly(err);
    }
  }

  async function resendCode() {
    try {
      const { demoCode } = await store.sendCode(pending.email);
      setPending((p) => ({ ...p, demoCode }));
    } catch (err) {
      throw new Error(friendly(err));
    }
  }

  // Step 2: correct code → register → instructions popup → wheel.
  async function verifyAndRegister(code) {
    const { name, email } = pending;
    let ok;
    try { ok = await store.verifyCode(email, code); }
    catch (err) { return friendly(err); }
    if (!ok) return "That code isn’t right or has expired. Check it and try again.";

    const deviceId = Device.id();
    let regId;
    try {
      regId = await store.createRegistration({ name, email, deviceId });
    } catch (err) {
      if (err.conflict === "email") return USED;
      if (err.conflict === "device") { setBlocked("device"); setPhase("blocked"); return; }
      return friendly(err);
    }
    // Lock this device straight away so a refresh can't give a second go.
    Device.markPlayed(regId);
    const s = { regId, name, email, stage: "wheel" };
    session.set(s);
    setPending(null);
    await enterWheel(s, true);
  }

  /* ---------- Wheel ---------- */
  const categories = useMemo(() => {
    if (!stock) return [];
    return CATEGORIES.filter((c) => c.jackpot || (stock[c.prize] ?? 0) > 0);
  }, [stock]);
  const segments = useMemo(() => layoutSegments(categories), [categories]);

  const pickIndex = (segs) => {
    const pool = segs.map((s, i) => [s, i]).filter(([s]) => !(s.cat.jackpot && jackpotTaken));
    const list = pool.length ? pool : segs.map((s, i) => [s, i]);
    return list[Math.floor(Math.random() * list.length)][1];
  };

  function onSpinStart() {
    setSpun(true);
    sound.whoosh();
  }

  async function onResult(cat) {
    const qIndex = cat.jackpot ? null : Math.floor(Math.random() * cat.questions.length);
    const s = session.patch({ stage: "question", landed: cat.name, qIndex });
    setPlayer(s);
    if (cat.jackpot) {
      session.patch({ answered: true, prize: cfg.JACKPOT_PRIZE });
      store.setPrize(s.regId, cfg.JACKPOT_PRIZE).catch(() => {});
      setJackpotTaken(true);
    }
    setLanded({ cat, question: cat.jackpot ? null : cat.questions[qIndex] });
    if (!cat.jackpot) sound.duck(true);
    setModal("question");
  }

  async function onAnswer(correct) {
    session.patch({ answered: true });
    sound.duck(false);
    if (!correct || !landed) return null;
    const available = Object.entries(stock || {}).filter(([, n]) => n > 0).map(([k]) => k);
    let prize = null;
    for (const tier of cfg.PRIZE_TIERS) {
      for (const name of shuffle(tier.filter((t) => available.includes(t)))) {
        try {
          if (await store.decrementStock(name)) { prize = name; break; }
        } catch {}
      }
      if (prize) break;
    }
    if (!prize) prize = landed.cat.prize;
    session.patch({ prize });
    store.setPrize(player.regId, prize).catch(() => {});
    return prize;
  }

  function finish() {
    const s = session.patch({ stage: "done" });
    setPlayer(s);
    setModal(null);
    setTimeout(() => setPhase("done"), 250);
  }

  /* ---------- Render ---------- */
  return (
    <main className="shell">
      <Hero compact={phase === "wheel"} />

      {phase === "loading" && <p className="spin-hint">Loading…</p>}

      {phase === "register" && <RegisterForm initial={draft} onSubmit={startVerify} />}

      {phase === "verify" && pending && (
        <VerifyCode
          email={pending.email}
          demoCode={pending.demoCode}
          onVerify={verifyAndRegister}
          onResend={resendCode}
          onBack={() => { setDraft(pending); setPending(null); setPhase("register"); }}
        />
      )}

      {phase === "blocked" && (
        <StatusCard icon="🔒" eyebrow="Already played" title="This device has had its spin">
          <p>Each device and each email can play once. Come find us at the CHS booth if you’d like to chat more!</p>
        </StatusCard>
      )}

      {phase === "wheel" && (
        <>
          {player && (
            <div className="player-chip">
              <span className="av">{player.name?.[0]?.toUpperCase()}</span>
              Good luck, {player.name?.split(" ")[0]}!
            </div>
          )}
          {stock === null ? (
            <p className="spin-hint">Loading prizes…</p>
          ) : (
            <>
              <Wheel
                ref={wheel}
                segments={segments}
                disabled={spun || modal === "howto"}
                pickIndex={pickIndex}
                onSpinStart={onSpinStart}
                onResult={onResult}
              />
              {!spun ? (
                <div style={{ width: "100%", maxWidth: 320 }}>
                  <button className="btn btn--dark" onClick={() => wheel.current?.spin()}>Spin the wheel</button>
                  <p className="spin-hint" style={{ marginTop: 12 }}>
                    <strong>One spin</strong> · one question · good luck!
                  </p>
                </div>
              ) : (
                <p className="spin-hint">{landed ? `Landed on ${landed.cat.icon} ${landed.cat.name}` : "Spinning…"}</p>
              )}
            </>
          )}
        </>
      )}

      {phase === "done" && (
        <StatusCard
          icon={player?.prize ? "🎁" : "🙌"}
          eyebrow="That’s a wrap"
          title={player?.prize ? "Thanks for playing!" : "Thanks for playing!"}
        >
          {player?.prize ? (
            <>
              <div className="prize">
                <small>Your prize</small>
                <strong>{player.prize === cfg.JACKPOT_PRIZE ? "⭐ Mystery prize" : player.prize}</strong>
              </div>
              <p className="claim">Show this screen at the CHS booth to claim it.</p>
            </>
          ) : (
            <p>You’ve used your one spin. Come find us at the CHS booth if you’d like to chat more!</p>
          )}
        </StatusCard>
      )}

      <div className="links">
        {phase === "register" && (
          <button className="link" onClick={() => setModal("qr")}><QR /> Get QR code</button>
        )}
      </div>

      <Modal open={modal === "howto"} dismissible={false} labelledBy="howto-title">
        {player && <Instructions name={player.name} onStart={() => setModal(null)} />}
      </Modal>

      <Modal open={modal === "question"} dismissible={false} labelledBy="q-title">
        {landed && (landed.cat.jackpot
          ? <JackpotResult onFinish={finish} />
          : <Question cat={landed.cat} question={landed.question} onAnswer={onAnswer} onFinish={finish} />)}
      </Modal>

      <QRModal open={modal === "qr"} onClose={() => setModal(null)} />
    </main>
  );
}

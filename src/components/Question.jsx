import { useEffect, useRef, useState } from "react";
import { sound } from "../lib/sound.js";
import { burst, jackpotShower } from "../lib/celebrate.js";

const SECONDS = 20;

function PrizeBox({ label, prize }) {
  return (
    <div className="prize">
      <span className="gift">🎁</span>
      <small>{label}</small>
      <strong>{prize}</strong>
    </div>
  );
}

export function JackpotResult({ onFinish }) {
  useEffect(() => { sound.jackpot(); jackpotShower(); }, []);
  return (
    <>
      <div className="m-head">
        <span className="m-emoji">⭐</span>
        <h2 id="q-title">JACKPOT!</h2>
        <p>You hit the rarest slice on the wheel.</p>
      </div>
      <PrizeBox label="You win" prize="Mystery prize" />
      <p className="claim" style={{ textAlign: "center" }}>Come see our booth staff to claim it!</p>
      <button className="btn" style={{ marginTop: 16 }} onClick={onFinish}>Awesome!</button>
    </>
  );
}

export default function Question({ cat, question, onAnswer, onFinish }) {
  const [picked, setPicked] = useState(null);      // option key, or "__timeout"
  const [prize, setPrize] = useState(null);
  const [left, setLeft] = useState(SECONDS);
  const answered = picked !== null;
  const doneRef = useRef(false);

  const options = question.type === "mc"
    ? question.options
    : [{ key: "True", text: "True" }, { key: "False", text: "False" }];
  const correct = picked === question.correct;
  const answerText = question.type === "mc"
    ? `${question.correct}) ${question.options.find((o) => o.key === question.correct).text}`
    : question.correct;

  const choose = async (key) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPicked(key);
    const ok = key === question.correct;
    if (ok) { sound.win(); burst(); } else sound.lose();
    const p = await onAnswer(ok);
    setPrize(p);
  };

  useEffect(() => {
    if (answered) return;
    if (left <= 0) { choose("__timeout"); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, answered]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <span className="q-topic">{cat.icon} {cat.name}</span>
      </div>
      <p id="q-title" className="q-text">{question.q}</p>

      <div className={`options${question.type === "tf" ? " tf" : ""}`}>
        {options.map((o) => {
          let cls = "opt";
          if (answered) {
            if (o.key === question.correct) cls += " is-correct";
            else if (o.key === picked) cls += " is-wrong";
            else cls += " is-dim";
          }
          return (
            <button key={o.key} className={cls} disabled={answered} onClick={() => { sound.click(); choose(o.key); }}>
              {question.type === "mc" && <span className="k">{o.key}</span>}
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <>
          <div className="timer" aria-hidden="true">
            <i style={{ transform: `scaleX(${left / SECONDS})`, transition: "transform 1s linear", background: left <= 5 ? "#C1573B" : undefined }} />
          </div>
          <p className="claim" style={{ textAlign: "center" }}>{left}s left</p>
        </>
      )}

      {answered && (
        <div className="result">
          {correct ? (
            <>
              <p className="verdict good">Correct! 🎉</p>
              {question.explain && <p>{question.explain}</p>}
              {prize && <PrizeBox label="You win" prize={prize} />}
              {prize && <p className="claim">Show this screen at the CHS booth to claim your prize.</p>}
            </>
          ) : (
            <>
              <p className="verdict bad">{picked === "__timeout" ? "Time’s up! ⏰" : "Not quite!"}</p>
              <p>
                The answer was <b style={{ color: "#1A1A1A" }}>{answerText}</b>.
                {question.explain ? ` ${question.explain}` : ""} No prize this time — but thanks for playing!
              </p>
            </>
          )}
          <button className="btn" style={{ marginTop: 18 }} onClick={onFinish}>
            {correct ? "Collect & finish" : "Finish"}
          </button>
        </div>
      )}
    </>
  );
}

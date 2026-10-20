import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Shield } from "./Icons.jsx";
import { sound } from "../lib/sound.js";

const C = 220;         // centre of the 440×440 viewBox
const R = 192;         // segment radius
const BULBS = 24;
const WHITE = "#FFFFFF";
const GOLD = "#EFC583";

const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
};

/** Lay out segments clockwise from 12 o'clock; the jackpot gets a thinner slice. */
export function layoutSegments(categories) {
  const w = (c) => (c.jackpot ? 0.45 : 1);
  const total = categories.reduce((s, c) => s + w(c), 0);
  let at = 0;
  return categories.map((cat) => {
    const span = (360 * w(cat)) / total;
    const seg = { cat, start: at, end: at + span, mid: at + span / 2, span };
    at += span;
    return seg;
  });
}

function segmentFills(segs) {
  const plain = segs.filter((s) => !s.cat.jackpot).length;
  let i = 0;
  return segs.map((s) => {
    if (s.cat.jackpot) return "url(#jackpotFill)";
    const white = plain % 2 === 1 ? i % 2 === 0 : i % 2 === 1;
    i++;
    return white ? WHITE : GOLD;
  });
}

const easeOut = (t) => 1 - Math.pow(1 - t, 4);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const Wheel = forwardRef(function Wheel({ segments, disabled, onSpinStart, onResult, pickIndex }, ref) {
  const rotor = useRef(null);
  const pointer = useRef(null);
  const rot = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const fills = useMemo(() => segmentFills(segments), [segments]);

  const segAt = (r) => {
    const a = (((-r) % 360) + 360) % 360;
    return segments.findIndex((s) => a >= s.start && a < s.end);
  };

  const kickPointer = () => {
    const el = pointer.current;
    if (!el) return;
    el.classList.remove("tick");
    void el.getBoundingClientRect();
    el.classList.add("tick");
  };

  const spin = () => {
    if (spinning || disabled || !segments.length) return;
    sound.unlock();
    const idx = pickIndex(segments);
    const target = segments[idx];
    const jitter = (Math.random() - 0.5) * target.span * 0.6;
    const turns = 6 + Math.floor(Math.random() * 2);
    const from = rot.current;
    const want = (((360 - (target.mid + jitter)) % 360) + 360) % 360;
    let delta = want - (((from % 360) + 360) % 360);
    if (delta < 0) delta += 360;
    const to = from + turns * 360 + delta;

    const windup = 380;   // little pull-back before release
    const dur = 5600;
    const back = 14;
    let last = segAt(from);
    let t0 = null;
    setSpinning(true);
    onSpinStart?.();

    const frame = (now) => {
      if (t0 === null) t0 = now;
      const el = now - t0;
      let r;
      if (el < windup) {
        r = from - back * easeInOut(el / windup);
      } else {
        const t = Math.min(1, (el - windup) / dur);
        r = from - back + (to - from + back) * easeOut(t);
      }
      rot.current = r;
      if (rotor.current) rotor.current.style.transform = `rotate(${r}deg)`;
      const cur = segAt(r);
      if (cur !== last) { last = cur; sound.tick(); kickPointer(); }
      if (el < windup + dur) {
        requestAnimationFrame(frame);
      } else {
        setSpinning(false);
        setTimeout(() => onResult(target.cat), 450);
      }
    };
    requestAnimationFrame(frame);
  };

  useImperativeHandle(ref, () => ({ spin }));

  return (
    <div className={`stage${spinning ? " is-spinning" : ""}`}>
      <svg ref={pointer} className="pointer" viewBox="0 0 52 64" aria-hidden="true">
        <defs>
          <linearGradient id="ptr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6CF8E" />
            <stop offset="1" stopColor="#C98B35" />
          </linearGradient>
        </defs>
        <path d="M26 62 4 18A22 22 0 1 1 48 18Z" fill="url(#ptr)" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="26" cy="20" r="7" fill="#1A1A1A" />
        <circle cx="26" cy="20" r="3" fill="#F1D9AC" />
      </svg>

      <svg className="wheel-svg" viewBox="0 0 440 440" role="img" aria-label="Prize wheel">
        <defs>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F1D9AC" />
            <stop offset="55%" stopColor="#E5AE60" />
            <stop offset="100%" stopColor="#B9802F" />
          </linearGradient>
          <radialGradient id="jackpotFill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#3a332a" />
            <stop offset="100%" stopColor="#1A1A1A" />
          </radialGradient>
          <radialGradient id="shine" cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity=".35" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="bulbGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={C} cy={C} r="216" fill="url(#rim)" />
        <circle cx={C} cy={C} r="198" fill="#1A1A1A" />

        <g ref={rotor} className="wheel-rotor" style={{ transform: `rotate(${rot.current}deg)` }}>
          {segments.map((s, i) => {
            const [x1, y1] = polar(R, s.start);
            const [x2, y2] = polar(R, s.end);
            const large = s.span > 180 ? 1 : 0;
            const [lx, ly] = polar(R * 0.53, s.mid);
            const [ix, iy] = polar(R * 0.86, s.mid);
            const flip = s.mid > 180;
            const angle = flip ? s.mid + 90 : s.mid - 90;
            const jp = s.cat.jackpot;
            return (
              <g key={s.cat.name}>
                <path
                  d={segments.length === 1
                    ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`
                    : `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={fills[i]}
                  stroke="rgba(26,26,26,.12)"
                  strokeWidth="1.5"
                />
                <text
                  className="seg-label"
                  x={lx} y={ly}
                  transform={`rotate(${angle} ${lx} ${ly})`}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={jp ? 12 : 15}
                  letterSpacing={jp ? 2 : 0}
                  style={jp ? { fill: "#E5AE60" } : undefined}
                >
                  {s.cat.short}
                </text>
                <text
                  className="seg-icon"
                  x={ix} y={iy}
                  transform={`rotate(${s.mid} ${ix} ${iy})`}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={jp ? 18 : 22}
                >
                  {s.cat.icon}
                </text>
              </g>
            );
          })}
          {/* Divider studs */}
          {segments.map((s) => {
            const [x, y] = polar(R - 4, s.start);
            return <circle key={`stud-${s.cat.name}`} cx={x} cy={y} r="3.5" fill="#F1D9AC" stroke="#B9802F" strokeWidth="1" />;
          })}
        </g>

        <circle cx={C} cy={C} r={R} fill="url(#shine)" pointerEvents="none" />

        {/* Marquee bulbs */}
        {Array.from({ length: BULBS }, (_, i) => {
          const [x, y] = polar(207, (360 / BULBS) * i);
          return (
            <circle
              key={i} cx={x} cy={y} r="4.2"
              className={`bulb${i % 2 ? " odd" : ""}`}
              style={{ animationDelay: i % 2 ? "-.25s" : "0s" }}
            />
          );
        })}
      </svg>

      <button className="hub" onClick={spin} disabled={spinning || disabled} aria-label="Spin the wheel">
        <Shield />
        <span>SPIN</span>
      </button>
    </div>
  );
});

export default Wheel;

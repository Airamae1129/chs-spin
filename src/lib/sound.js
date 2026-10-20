// Sound effects + looping background music, all synthesised with WebAudio —
// no audio files needed.
let ctx = null;
let master = null;   // everything → master → speakers (mute = master at 0)
let musicBus = null; // background music level (ducked during questions)
let sfxBus = null;
let noiseBuf = null;
let muted = (() => { try { return localStorage.getItem("chs.muted") === "1"; } catch { return false; } })();

const MUSIC_LEVEL = 1.0;
const DUCK_LEVEL = 0.32;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_LEVEL;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = "sine", gain = 0.15, bus = sfxBus, at } = {}) {
  const a = ac();
  if (!a) return;
  const t = at ?? a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function hat(t, gain) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(f).connect(g).connect(musicBus);
  src.start(t);
  src.stop(t + 0.06);
}

/* ---------- Background music ----------
 * Upbeat, light game-show loop: I–vi–IV–V in C with a plucky arpeggio,
 * soft bass and hi-hats. Scheduled with a small look-ahead timer. */
const BPM = 112;
const STEP = 60 / BPM / 2; // eighth notes
const n = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [
  { bass: 48, notes: [60, 64, 67, 72] }, // C
  { bass: 45, notes: [57, 60, 64, 69] }, // Am
  { bass: 41, notes: [57, 60, 65, 69] }, // F
  { bass: 43, notes: [59, 62, 67, 71] }, // G
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];      // pattern within each bar
const MELODY = [                          // gentle top line, 1 note per beat (null = rest)
  76, null, 74, 72, 72, null, 71, 69,
  69, null, 72, 74, 74, null, 76, 74,
];

let musicTimer = null;
let nextTime = 0;
let step = 0;

function scheduleStep(i, t) {
  const bar = Math.floor(i / 8) % CHORDS.length;
  const within = i % 8;
  const chord = CHORDS[bar];
  tone(n(chord.notes[ARP[within]]), 0, 0.22, { type: "triangle", gain: 0.05, bus: musicBus, at: t });
  if (within === 0 || within === 4) tone(n(chord.bass), 0, 0.42, { type: "sine", gain: 0.14, bus: musicBus, at: t });
  if (within % 2 === 1) hat(t, 0.025);
  if (within % 2 === 0) {
    const m = MELODY[(Math.floor(i / 2)) % MELODY.length];
    if (m && Math.floor(i / 32) % 2 === 1) tone(n(m), 0, 0.5, { type: "sine", gain: 0.045, bus: musicBus, at: t });
  }
}

function startMusic() {
  if (musicTimer || !ac()) return;
  nextTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(step++, nextTime);
      nextTime += STEP;
    }
  }, 50);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

export const sound = {
  isMuted: () => muted,
  setMuted(m) {
    muted = m;
    try { localStorage.setItem("chs.muted", m ? "1" : "0"); } catch {}
    if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
    if (!m) startMusic();
  },
  unlock() {
    ac();
    startMusic();
  },
  stopMusic,
  /** Lower the music while the player is thinking. */
  duck(on) {
    if (!musicBus) return;
    musicBus.gain.setTargetAtTime(on ? DUCK_LEVEL : MUSIC_LEVEL, ctx.currentTime, 0.3);
  },
  tick: () => tone(1400, 0, 0.04, { type: "square", gain: 0.05 }),
  click: () => tone(660, 0, 0.08, { type: "triangle", gain: 0.1 }),
  whoosh() {
    const a = ac();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime;
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.35);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + 0.45);
  },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, { type: "triangle", gain: 0.16 })); },
  jackpot() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.4, { type: "triangle", gain: 0.16 }));
  },
  lose() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.3, { type: "sine", gain: 0.14 })); },
};

// Browsers only allow audio after a user gesture: start the music on the first tap/key.
if (typeof window !== "undefined") {
  const kick = () => {
    sound.unlock();
    window.removeEventListener("pointerdown", kick);
    window.removeEventListener("keydown", kick);
  };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("keydown", kick);
}

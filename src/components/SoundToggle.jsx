import { useState } from "react";
import { sound } from "../lib/sound.js";
import { SoundOff, SoundOn } from "./Icons.jsx";

export default function SoundToggle() {
  const [muted, setMuted] = useState(sound.isMuted());
  const toggle = () => { sound.setMuted(!muted); setMuted(!muted); if (muted) sound.click(); };
  return (
    <button className="sound-toggle" onClick={toggle} aria-label={muted ? "Turn music and sound on" : "Mute music and sound"} title={muted ? "Sound off" : "Sound on"}>
      {muted ? <SoundOff /> : <SoundOn />}
    </button>
  );
}

import confetti from "canvas-confetti";

const BRAND = ["#E5AE60", "#F1D9AC", "#DA9F49", "#1A1A1A", "#FFFFFF"];
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function burst() {
  if (reduced()) return;
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.65 }, colors: BRAND, zIndex: 70 });
}

export function jackpotShower() {
  if (reduced()) return;
  const end = Date.now() + 2200;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: BRAND, zIndex: 70 });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: BRAND, zIndex: 70 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 200, spread: 140, startVelocity: 45, origin: { y: 0.55 }, colors: BRAND, shapes: ["square", "circle"], zIndex: 70 });
}

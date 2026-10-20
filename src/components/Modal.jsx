import { useEffect, useState } from "react";
import { Close } from "./Icons.jsx";

/** Animated dialog: centred card on desktop, bottom sheet on phones. */
export default function Modal({ open, onClose, dismissible = true, labelledBy, children }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); }
    else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => { setMounted(false); setClosing(false); }, 240);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  if (!mounted) return null;
  return (
    <div className={`modal${closing ? " closing" : ""}`}>
      <div className="modal__backdrop" onClick={dismissible ? onClose : undefined} />
      <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {dismissible && (
          <button className="modal__close" onClick={onClose} aria-label="Close"><Close /></button>
        )}
        {children}
      </div>
    </div>
  );
}

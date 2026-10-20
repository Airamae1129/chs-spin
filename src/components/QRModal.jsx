import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Modal from "./Modal.jsx";
import cfg from "../config.js";

export default function QRModal({ open, onClose }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!open) return;
    const url = cfg.PUBLIC_URL || window.location.origin + "/";
    QRCode.toDataURL(url, { width: 440, margin: 1, color: { dark: "#1A1A1A", light: "#FFFFFF" } })
      .then(setSrc).catch(() => setSrc(""));
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} labelledBy="qr-title">
      <div className="m-head">
        <h2 id="qr-title">Scan to play</h2>
        <p>Point any phone camera at the code to open this game.</p>
        <p style={{ marginTop: 6, fontSize: ".8rem", wordBreak: "break-all" }}>{cfg.PUBLIC_URL}</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="qr-box">
          {src ? <img src={src} alt="QR code to open the game" width="220" height="220" /> : <p>QR unavailable</p>}
        </div>
      </div>
    </Modal>
  );
}

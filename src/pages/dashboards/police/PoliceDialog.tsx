import { useEffect, useRef, type ReactNode } from "react";
import AdminIcon from "../../../components/admin/AdminIcons";

export default function PoliceDialog({ title, eyebrow, busy = false, onClose, children }: { title: string; eyebrow: string; busy?: boolean; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => { dialog?.close(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);
  return <dialog className="police-dialog" ref={dialogRef} aria-labelledby="police-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><div className="police-dialog-content"><header className="police-dialog-heading"><div><p className="police-eyebrow">{eyebrow}</p><h2 id="police-dialog-title">{title}</h2></div><button type="button" className="police-icon-button" disabled={busy} onClick={onClose} aria-label="Đóng hộp thoại"><AdminIcon name="close" /></button></header>{children}</div></dialog>;
}

import React, { useEffect } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`toast toast--${toast.type}`} role="status">
      <span className="toast__icon">
        {toast.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
      </span>
      <div className="toast__body">
        <strong>{toast.title}</strong>
        <p>{toast.body}</p>
      </div>
      <button className="toast__close" onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

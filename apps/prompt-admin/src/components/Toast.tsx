import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners = new Set<(t: ToastMessage) => void>();

export function showToast(message: string, type: ToastType = 'info') {
  const toast = { id: ++toastId, message, type };
  listeners.forEach(fn => fn(toast));
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (t: ToastMessage) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px',
          borderRadius: 6,
          color: 'white',
          fontSize: 14,
          maxWidth: 320,
          background: t.type === 'success' ? '#059669' : t.type === 'error' ? '#dc2626' : '#2563eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

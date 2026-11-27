import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastMessage } from '../components/Toast';

const TOAST_AUTO_DISMISS_MS = 3600;
const MAX_VISIBLE_TOASTS = 4;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE_TOASTS - 1)), { id, type, title, description }]);
      setStatusAnnouncement(description ? `${title}. ${description}` : title);

      const timerId = window.setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_AUTO_DISMISS_MS);

      timersRef.current.set(id, timerId);
    },
    []
  );

  return {
    toasts,
    statusAnnouncement,
    pushToast,
    dismissToast,
  };
}

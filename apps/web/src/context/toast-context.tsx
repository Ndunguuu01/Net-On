'use client';

// ============================================
// Net-On — Toast Notification Context
// ============================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl backdrop-blur-xl border shadow-2xl flex items-start gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 ${
              t.type === 'success'
                ? 'bg-card/90 border-emerald-500/30 text-emerald-400'
                : t.type === 'error'
                ? 'bg-card/90 border-rose-500/30 text-rose-400'
                : 'bg-card/90 border-primary/30 text-primary'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />}

            <div className="flex-1 text-foreground">{t.message}</div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

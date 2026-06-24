"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "degradation";
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showDegradation: (amount: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const defaultDuration = type === "degradation" ? undefined : 6000;
      const finalDuration = duration ?? defaultDuration;

      setToasts((prev) => [...prev, { id, type, title, message, duration: finalDuration }]);

      if (finalDuration) {
        setTimeout(() => {
          removeToast(id);
        }, finalDuration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "success", title: title ?? "Sucesso", message });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "error", title: title ?? "Erro", message });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "warning", title: title ?? "Aviso", message });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "info", title: title ?? "Informação", message });
    },
    [showToast]
  );

  const showDegradation = useCallback(
    (amount: number) => {
      showToast({
        type: "degradation",
        title: "🩸 DEGRADAÇÃO MORAL 🩸",
        message: `Suas Máculas ultrapassaram o limite da Humanidade. A Besta consome sua mente e você sofreu ${amount} de Dano Agravado na Força de Vontade.`,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showDegradation,
        removeToast,
      }}
    >
      {children}

      {/* Contêiner de Toasts flutuantes */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => {
          let borderClass = "border-white/10";
          let shadowClass = "shadow-none";
          let titleColor = "text-text-primary";
          let icon = "🩸";

          switch (toast.type) {
            case "success":
              borderClass = "border-emerald-600/40";
              shadowClass = "shadow-[0_0_12px_rgba(16,185,129,0.15)]";
              titleColor = "text-emerald-400";
              icon = "⚖️";
              break;
            case "error":
              borderClass = "border-blood-red";
              shadowClass = "shadow-[0_0_12px_rgba(200,36,52,0.3)]";
              titleColor = "text-blood-red";
              icon = "❌";
              break;
            case "warning":
            case "info":
              borderClass = "border-gold-accent/40";
              shadowClass = "shadow-[0_0_12px_rgba(255,216,77,0.15)]";
              titleColor = "text-gold-accent";
              icon = "⚜️";
              break;
            case "degradation":
              borderClass = "border-hunger-red";
              shadowClass = "shadow-[0_0_20px_rgba(255,92,107,0.35)]";
              titleColor = "text-hunger-red animate-pulse";
              icon = "💀";
              break;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full bg-black/95 border ${borderClass} rounded-xs p-4 ${shadowClass} backdrop-blur-sm animate-slide-in flex flex-col space-y-2`}
              role="alert"
            >
              <div className="flex items-start justify-between border-b border-white/5 pb-2">
                <div className="flex flex-col">
                  <span className={`text-xs font-gothic ${titleColor} tracking-widest uppercase flex items-center gap-1.5`}>
                    {icon} {toast.title || toast.type}
                  </span>
                  {toast.type === "degradation" && (
                    <span className="text-[8px] text-text-muted font-data uppercase tracking-wider">
                      Corrupção da Alma
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-text-muted hover:text-white transition-colors text-[10px] font-data cursor-pointer uppercase select-none"
                  title="Fechar"
                >
                  [X]
                </button>
              </div>

              <p className="text-[11px] text-text-primary font-reading leading-relaxed">
                {toast.message}
              </p>

              {toast.type === "degradation" && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="px-3.5 py-1.5 bg-burgundy/60 border border-hunger-red hover:bg-hunger-red text-text-primary text-[9px] font-bold font-data uppercase tracking-widest rounded-xs transition-all duration-150 shadow-[0_0_8px_rgba(200,36,52,0.2)] cursor-pointer select-none animate-pulse"
                  >
                    Aceitar o Destino
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextType = {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  showConfirm: (message: string) => Promise<boolean>;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showToast = (type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({ message, resolve });
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleConfirm = (value: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(value);
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "border-[#5C27FE]/25 bg-[#0F0F1A] text-white"
                : toast.type === "error"
                  ? "border-[#FF4D4D]/30 bg-[#1A1012] text-white"
                  : "border-white/10 bg-[#0F0F1A] text-white"
            } animate-fadeIn`}
          >
            {toast.type === "success" && (
              <CheckCircle size={18} className="text-[#A98CFF] shrink-0" />
            )}
            {toast.type === "error" && (
              <AlertCircle size={18} className="text-[#FF7A7A] shrink-0" />
            )}
            {toast.type === "info" && (
              <Info size={18} className="text-white/80 shrink-0" />
            )}
            <span
              className="text-sm font-semibold text-white"
            >
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded-md p-1 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X
                size={14}
                className="text-inherit"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F0F1A] p-6 shadow-2xl animate-fadeIn">
            <h3 className="mb-2 text-lg font-bold text-white">Confirm Action</h3>
            <p className="mb-6 text-sm text-white/75">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleConfirm(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="rounded-lg bg-[#5C27FE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a1ee3] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

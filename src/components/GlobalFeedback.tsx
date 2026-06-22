import { useEffect, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { notificationEvents, type ConfirmPayload, type ToastPayload } from "../lib/notifications";

type ToastItem = Required<ToastPayload> & { id: string };

export default function GlobalFeedback() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmPayload | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<ToastPayload>;
      const toast = {
        id: custom.detail.id || crypto.randomUUID(),
        type: custom.detail.type,
        message: custom.detail.message,
        duration: custom.detail.duration ?? 4000,
      };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.duration);
    };

    const onConfirm = (event: Event) => {
      setConfirmState((event as CustomEvent<ConfirmPayload>).detail);
    };

    const onConfirmResponse = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; accepted: boolean }>).detail;
      setConfirmState((current) => (current?.id === detail.id ? null : current));
    };

    window.addEventListener(notificationEvents.toast, onToast);
    window.addEventListener(notificationEvents.confirm, onConfirm);
    window.addEventListener(`${notificationEvents.confirm}:response`, onConfirmResponse);
    return () => {
      window.removeEventListener(notificationEvents.toast, onToast);
      window.removeEventListener(notificationEvents.confirm, onConfirm);
      window.removeEventListener(`${notificationEvents.confirm}:response`, onConfirmResponse);
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-5 left-1/2 z-[80] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "border-[#5C27FE]/25 bg-[#0F0F1A] text-white"
                : toast.type === "error"
                  ? "border-[#FF4D4D]/30 bg-[#1A1012] text-white"
                  : "border-white/10 bg-[#0F0F1A] text-white"
            }`}
          >
            <div
              className={`mt-0.5 rounded-full p-1.5 ${
                toast.type === "success"
                  ? "bg-[#5C27FE]/15 text-[#A98CFF]"
                  : toast.type === "error"
                    ? "bg-[#FF4D4D]/15 text-[#FF8C8C]"
                    : "bg-white/10 text-white/80"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={14} />
              ) : toast.type === "error" ? (
                <TriangleAlert size={14} />
              ) : (
                <Info size={14} />
              )}
            </div>
            <div className="flex-1 text-sm font-semibold leading-5">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
              className="rounded-md p-1 text-white/60 hover:bg-white/5 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F0F1A] p-5 text-white shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[#5C27FE]/15 p-2 text-[#A98CFF]">
                <TriangleAlert size={16} />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold">Please confirm</div>
                <div className="mt-1 text-sm leading-6 text-white/75">{confirmState.message}</div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const detail = { id: confirmState.id, accepted: false };
                  window.dispatchEvent(
                    new CustomEvent(`${notificationEvents.confirm}:response`, { detail })
                  );
                  setConfirmState(null);
                }}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/80"
              >
                {confirmState.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const detail = { id: confirmState.id, accepted: true };
                  window.dispatchEvent(
                    new CustomEvent(`${notificationEvents.confirm}:response`, { detail })
                  );
                  setConfirmState(null);
                }}
                className="rounded-lg bg-[#5C27FE] px-4 py-2 text-sm font-semibold text-white"
              >
                {confirmState.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

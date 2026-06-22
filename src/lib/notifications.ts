export type ToastType = "info" | "success" | "error";

export type ToastPayload = {
  id?: string;
  type: ToastType;
  message: string;
  duration?: number;
};

export type ConfirmPayload = {
  id: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

const TOAST_EVENT = "newday:toast";
const CONFIRM_EVENT = "newday:confirm";

export function notify(type: ToastType, message: string, duration = 4000) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, {
      detail: { id: crypto.randomUUID(), type, message, duration },
    })
  );
}

export function notifySuccess(message: string, duration = 4000) {
  notify("success", message, duration);
}

export function notifyError(message: string, duration = 5000) {
  notify("error", message, duration);
}

export function notifyInfo(message: string, duration = 3500) {
  notify("info", message, duration);
}

export function confirmAction(
  message: string,
  options?: { confirmLabel?: string; cancelLabel?: string }
): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    const id = crypto.randomUUID();
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ id: string; accepted: boolean }>;
      if (custom.detail.id !== id) return;
      window.removeEventListener(`${CONFIRM_EVENT}:response`, handler as EventListener);
      resolve(custom.detail.accepted);
    };

    window.addEventListener(`${CONFIRM_EVENT}:response`, handler as EventListener);
    window.dispatchEvent(
      new CustomEvent<ConfirmPayload>(CONFIRM_EVENT, {
        detail: {
          id,
          message,
          confirmLabel: options?.confirmLabel,
          cancelLabel: options?.cancelLabel,
        },
      })
    );
  });
}

export const notificationEvents = {
  toast: TOAST_EVENT,
  confirm: CONFIRM_EVENT,
} as const;

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
let listeners: Listener[] = [];
let counter = 0;

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

function add(type: ToastType, message: string, duration = 3000) {
  const id = `toast-${++counter}`;
  toasts = [...toasts, { id, type, message }];
  notify();
  setTimeout(() => remove(id), duration);
}

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (msg: string) => add("success", msg),
  error: (msg: string) => add("error", msg, 5000),
  info: (msg: string) => add("info", msg),
};

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getToasts() {
  return toasts;
}

export function dismissToast(id: string) {
  remove(id);
}

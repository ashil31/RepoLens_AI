/**
 * Central toast API. Uses Sonner under the hood.
 * Import from here everywhere for consistent success / error / warning / info toasts.
 */
import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description }),
  /** Plain toast (no icon/type) */
  message: (message: string, description?: string) =>
    sonnerToast(message, { description }),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  promise: sonnerToast.promise,
};

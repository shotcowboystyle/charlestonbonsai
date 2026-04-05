import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  callback: () => void
}

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  action?: ToastAction
  duration: number
  createdAt: number
}

interface ToastOptions {
  title: string
  description?: string
  action?: ToastAction
  duration?: number
}

const MAX_TOASTS = 5

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 7000,
  warning: 5000,
  info: 5000,
}

let toastCounter = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function addToast(type: ToastType, options: ToastOptions): string {
    const id = `toast-${++toastCounter}-${Date.now()}`
    const duration = options.duration ?? DEFAULT_DURATIONS[type]

    const toast: Toast = {
      id,
      type,
      title: options.title,
      description: options.description,
      action: options.action,
      duration,
      createdAt: Date.now(),
    }

    // Enforce max toasts — remove oldest first
    while (toasts.value.length >= MAX_TOASTS) {
      const oldest = toasts.value[0]
      if (oldest) removeToast(oldest.id)
    }

    toasts.value.push(toast)

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  function removeToast(id: string) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(title: string, description?: string) {
    return addToast('success', { title, description })
  }

  function error(title: string, description?: string, action?: ToastAction) {
    return addToast('error', { title, description, action })
  }

  function warning(title: string, description?: string) {
    return addToast('warning', { title, description })
  }

  function info(title: string, description?: string) {
    return addToast('info', { title, description })
  }

  function clearAll() {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    toasts.value = []
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  }
})

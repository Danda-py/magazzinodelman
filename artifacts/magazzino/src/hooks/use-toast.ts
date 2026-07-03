// Simplified useToast hook
import { useState, useEffect } from "react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type Toast = Omit<ToastProps, "id">

const toastListeners = new Set<(toasts: ToastProps[]) => void>()
let toasts: ToastProps[] = []

export function toast(props: Toast) {
  const id = genId()
  const newToast = { ...props, id }
  toasts = [...toasts, newToast]
  toastListeners.forEach((listener) => listener(toasts))
  
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    toastListeners.forEach((listener) => listener(toasts))
  }, 5000)
}

export function useToast() {
  const [state, setState] = useState<ToastProps[]>(toasts)

  useEffect(() => {
    toastListeners.add(setState)
    return () => {
      toastListeners.delete(setState)
    }
  }, [])

  return { toasts: state, toast }
}

"use client"

import * as React from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "default" | "success" | "error"

interface ToastItem {
  id: number
  title?: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (opts: { title?: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const remove = React.useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback<ToastContextValue["toast"]>((opts) => {
    const id = Date.now() + Math.random()
    setToasts((cur) => [...cur, { id, variant: "default", ...opts }])
    setTimeout(() => remove(id), 4500)
  }, [remove])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const variantStyles: Record<ToastVariant, { border: string; icon: React.ReactNode }> = {
  default: { border: "border-black", icon: <Info className="h-5 w-5" /> },
  success: { border: "border-green-600", icon: <CheckCircle2 className="h-5 w-5 text-green-600" /> },
  error: { border: "border-red-600", icon: <XCircle className="h-5 w-5 text-red-600" /> },
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const v = variantStyles[toast.variant]
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border-2 bg-white p-4 shadow-lg animate-in slide-in-from-bottom-2",
        v.border
      )}
      role="status"
    >
      <div className="mt-0.5">{v.icon}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
        {toast.description && <p className="text-sm text-gray-600">{toast.description}</p>}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-black" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    // Graceful fallback so a missing provider never crashes an action handler.
    return { toast: () => {} }
  }
  return ctx
}

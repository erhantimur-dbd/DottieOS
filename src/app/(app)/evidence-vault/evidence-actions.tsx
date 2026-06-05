"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { CheckCircle, XCircle, Trash2 } from "lucide-react"
import { setEvidenceStatus, deleteEvidenceItem } from "./actions"

export function ToggleReadyButton({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const isReady = status === "READY"
  const next = isReady ? "NOT_READY" : "READY"
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setEvidenceStatus(id, next)
          if (res.ok) {
            toast({ variant: "success", title: isReady ? "Marked not ready" : "Marked ready" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      {isReady ? (
        <>
          <XCircle className="h-4 w-4 mr-2" />
          {pending ? "…" : "Mark not ready"}
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          {pending ? "…" : "Mark ready"}
        </>
      )}
    </Button>
  )
}

export function DeleteEvidenceButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this evidence item? This cannot be undone.")) return
        startTransition(async () => {
          const res = await deleteEvidenceItem(id)
          if (res.ok) {
            toast({ variant: "success", title: "Evidence item deleted" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { BellRing, Trash2 } from "lucide-react"
import { markParentNotified, deleteIncident } from "./actions"

export function MarkNotifiedButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await markParentNotified(id)
          if (res.ok) {
            toast({ variant: "success", title: "Parent notified" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      <BellRing className="h-4 w-4 mr-1" />
      {pending ? "…" : "Mark parent notified"}
    </Button>
  )
}

export function DeleteIncidentButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this incident? This cannot be undone.")) return
        startTransition(async () => {
          const res = await deleteIncident(id)
          if (res.ok) {
            toast({ variant: "success", title: "Incident deleted" })
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

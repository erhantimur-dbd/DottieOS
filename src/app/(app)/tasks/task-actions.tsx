"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Check, Trash2 } from "lucide-react"
import { setTaskStatus, deleteTask } from "./actions"

export function CompleteTaskButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setTaskStatus(id, "COMPLETED")
          if (res.ok) {
            toast({ variant: "success", title: "Task completed" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      <Check className="h-4 w-4 mr-1" />
      {pending ? "…" : "Complete"}
    </Button>
  )
}

export function DeleteTaskButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this task? This cannot be undone.")) return
        startTransition(async () => {
          const res = await deleteTask(id)
          if (res.ok) {
            toast({ variant: "success", title: "Task deleted" })
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

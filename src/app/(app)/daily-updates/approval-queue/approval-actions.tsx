"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, Send } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { approveUpdate, sendUpdateNow } from "../actions"

export function ApproveButton({ dailyUpdateId }: { dailyUpdateId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      className="flex-1"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await approveUpdate(dailyUpdateId)
          if (res.ok) {
            toast({ variant: "success", title: "Update approved" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Could not approve", description: res.error })
          }
        })
      }
    >
      <Check className="h-4 w-4 mr-2" />
      {pending ? "Approving…" : "Approve"}
    </Button>
  )
}

export function SendNowButton({ dailyUpdateId, className }: { dailyUpdateId: string; className?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendUpdateNow(dailyUpdateId)
          if (res.ok) {
            toast({ variant: "success", title: "Update sent to guardians" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Not sent", description: res.error })
          }
        })
      }
    >
      <Send className="h-4 w-4 mr-2" />
      {pending ? "Sending…" : "Send now"}
    </Button>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Send, Trash2 } from "lucide-react"
import { markPaid, sendReminder, deleteInvoice } from "./actions"

export function MarkPaidButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await markPaid(id)
          if (res.ok) {
            toast({ variant: "success", title: "Marked as paid" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      {pending ? "…" : "Mark Paid"}
    </Button>
  )
}

export function SendReminderButton({ id }: { id: string }) {
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
          const res = await sendReminder(id)
          if (res.ok) {
            toast({ variant: "success", title: "Reminder sent" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      <Send className="h-4 w-4 mr-2" />
      {pending ? "…" : "Send Reminder"}
    </Button>
  )
}

export function DeleteInvoiceButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this invoice? This cannot be undone.")) return
        startTransition(async () => {
          const res = await deleteInvoice(id)
          if (res.ok) {
            toast({ variant: "success", title: "Invoice deleted" })
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

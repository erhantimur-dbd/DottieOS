"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Trash2 } from "lucide-react"
import { deleteTemplate } from "./actions"

export function DeleteTemplateButton({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this template? This will remove its consent records and cannot be undone.")) return
        startTransition(async () => {
          const res = await deleteTemplate(id)
          if (res.ok) {
            toast({ variant: "success", title: "Template deleted" })
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

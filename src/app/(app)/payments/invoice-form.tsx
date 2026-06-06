"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Plus } from "lucide-react"
import { createInvoice } from "./actions"

interface ChildOption {
  id: string
  name: string
}

export function InvoiceFormDialog({
  childOptions,
  triggerLabel = "Create Invoice",
}: {
  childOptions: ChildOption[]
  triggerLabel?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [form, setForm] = useState({
    childId: childOptions[0]?.id ?? "",
    amount: "",
    dueDate: "",
    description: "",
  })

  const submit = () =>
    startTransition(async () => {
      const res = await createInvoice({
        childId: form.childId,
        amount: form.amount,
        dueDate: form.dueDate,
        description: form.description || null,
      })
      if (res.ok) {
        toast({ variant: "success", title: "Invoice created" })
        setOpen(false)
        setForm({ childId: childOptions[0]?.id ?? "", amount: "", dueDate: "", description: "" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  const valid = form.childId && form.amount && Number(form.amount) > 0 && form.dueDate

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childId">Child</Label>
            <select
              id="childId"
              className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm"
              value={form.childId}
              onChange={(e) => setForm({ ...form, childId: e.target.value })}
            >
              {childOptions.length === 0 && <option value="">No childOptions</option>}
              {childOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. June fees"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? "Saving…" : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

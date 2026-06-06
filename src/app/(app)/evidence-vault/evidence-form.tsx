"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Plus, Pencil } from "lucide-react"
import { createEvidenceItem, updateEvidenceItem } from "./actions"

interface EvidenceData {
  id: string
  name: string
  description: string | null
  category: string
  notes: string | null
}

const CATEGORIES = [
  "Policies",
  "Training",
  "Risk Assessments",
  "Safeguarding",
  "Records",
  "Other",
]

export function EvidenceFormDialog({
  item,
  trigger,
}: {
  item?: EvidenceData
  trigger?: "default" | "first"
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!item

  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    category: item?.category ?? CATEGORIES[0],
    notes: item?.notes ?? "",
  })

  const submit = () =>
    startTransition(async () => {
      const res = isEdit
        ? await updateEvidenceItem({
            id: item!.id,
            name: form.name,
            description: form.description || null,
            category: form.category,
            notes: form.notes || null,
          })
        : await createEvidenceItem({
            name: form.name,
            description: form.description || null,
            category: form.category,
          })
      if (res.ok) {
        toast({ variant: "success", title: isEdit ? "Evidence item updated" : "Evidence item created" })
        setOpen(false)
        if (!isEdit) setForm({ name: "", description: "", category: CATEGORIES[0], notes: "" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {trigger === "first" ? "Add First Item" : "Add Evidence Item"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Evidence Item" : "Add Evidence Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Safeguarding Policy"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !form.name.trim()}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

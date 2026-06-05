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
import { createTemplate, updateTemplate } from "./actions"

interface TemplateData {
  id: string
  name: string
  description: string | null
  requiresExpiry: boolean
}

export function TemplateFormDialog({ template }: { template?: TemplateData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!template

  const [form, setForm] = useState({
    name: template?.name ?? "",
    description: template?.description ?? "",
    requiresExpiry: template?.requiresExpiry ?? false,
  })

  const submit = () =>
    startTransition(async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        requiresExpiry: form.requiresExpiry,
      }
      const res = isEdit
        ? await updateTemplate({ ...payload, id: template!.id })
        : await createTemplate(payload)
      if (res.ok) {
        toast({ variant: "success", title: isEdit ? "Template updated" : "Template created" })
        setOpen(false)
        if (!isEdit) setForm({ name: "", description: "", requiresExpiry: false })
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
            Add Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Template" : "Add Template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Photo Consent"
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
          <div className="flex items-center gap-2">
            <input
              id="requiresExpiry"
              type="checkbox"
              className="h-4 w-4 rounded border-2 border-black"
              checked={form.requiresExpiry}
              onChange={(e) => setForm({ ...form, requiresExpiry: e.target.checked })}
            />
            <Label htmlFor="requiresExpiry">Requires expiry date</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !form.name.trim()}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { FileCheck } from "lucide-react"
import { recordConsent } from "./actions"

interface TemplateOption {
  id: string
  name: string
}

const STATUSES = [
  { value: "MISSING", label: "Missing" },
  { value: "SIGNED", label: "Signed" },
  { value: "EXPIRED", label: "Expired" },
]

export function ConsentRecordDialog({
  childId,
  childName,
  templates,
}: {
  childId: string
  childName: string
  templates: TemplateOption[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [form, setForm] = useState({
    templateId: templates[0]?.id ?? "",
    status: "SIGNED",
    signedDate: "",
    expiryDate: "",
    notes: "",
  })

  const submit = () =>
    startTransition(async () => {
      const res = await recordConsent({
        childId,
        templateId: form.templateId,
        status: form.status as "MISSING" | "SIGNED" | "EXPIRED",
        signedDate: form.signedDate || null,
        expiryDate: form.expiryDate || null,
        notes: form.notes || null,
      })
      if (res.ok) {
        toast({ variant: "success", title: "Consent recorded" })
        setOpen(false)
        setForm({ templateId: templates[0]?.id ?? "", status: "SIGNED", signedDate: "", expiryDate: "", notes: "" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={templates.length === 0}>
          <FileCheck className="h-4 w-4 mr-2" />
          Record consent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record consent — {childName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateId">Consent type</Label>
            <select
              id="templateId"
              className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signedDate">Signed date</Label>
              <Input
                id="signedDate"
                type="date"
                value={form.signedDate}
                onChange={(e) => setForm({ ...form, signedDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !form.templateId}>
            {pending ? "Saving…" : "Save consent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

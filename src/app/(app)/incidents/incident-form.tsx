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
import { logIncident, updateIncident } from "./actions"

interface ChildOption {
  id: string
  name: string
}

interface IncidentData {
  id: string
  childId: string
  date: string // yyyy-mm-dd
  time: string
  description: string
  actionTaken: string | null
  witnesses: string | null
}

export function IncidentFormDialog({
  childOptions,
  incident,
}: {
  childOptions: ChildOption[]
  incident?: IncidentData
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!incident

  const [form, setForm] = useState({
    childId: incident?.childId ?? "",
    date: incident?.date ?? "",
    time: incident?.time ?? "",
    description: incident?.description ?? "",
    actionTaken: incident?.actionTaken ?? "",
    witnesses: incident?.witnesses ?? "",
  })

  const submit = () =>
    startTransition(async () => {
      const payload = {
        ...form,
        actionTaken: form.actionTaken || null,
        witnesses: form.witnesses || null,
      }
      const res = isEdit
        ? await updateIncident({ ...payload, id: incident!.id })
        : await logIncident(payload)
      if (res.ok) {
        toast({ variant: "success", title: isEdit ? "Incident updated" : "Incident logged" })
        setOpen(false)
        if (!isEdit)
          setForm({ childId: "", date: "", time: "", description: "", actionTaken: "", witnesses: "" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  const valid = form.childId && form.date && form.time.trim() && form.description.trim()

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
            Log Incident
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Incident" : "Log Incident"}</DialogTitle>
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
              <option value="">Select a child</option>
              {childOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                placeholder="e.g. 14:30"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What happened?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actionTaken">Action taken</Label>
            <Textarea
              id="actionTaken"
              value={form.actionTaken}
              onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="witnesses">Witnesses</Label>
            <Input
              id="witnesses"
              value={form.witnesses}
              onChange={(e) => setForm({ ...form, witnesses: e.target.value })}
              placeholder="Names of any witnesses"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Log incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

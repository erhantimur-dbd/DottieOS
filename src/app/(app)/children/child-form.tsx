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
import { Plus, Edit } from "lucide-react"
import { createChild, updateChild } from "./actions"

interface UserOption {
  id: string
  name: string
}

interface ChildData {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string // yyyy-mm-dd
  startDate: string // yyyy-mm-dd
  room: string | null
  medicalNotes: string | null
  dietaryNeeds: string | null
  emergencyNotes: string | null
  keyPersonId: string | null
}

const emptyForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  startDate: "",
  room: "",
  medicalNotes: "",
  dietaryNeeds: "",
  emergencyNotes: "",
  keyPersonId: "",
}

export function ChildFormDialog({
  users,
  child,
  triggerLabel,
}: {
  users: UserOption[]
  child?: ChildData
  triggerLabel?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!child

  const [form, setForm] = useState({
    firstName: child?.firstName ?? "",
    lastName: child?.lastName ?? "",
    dateOfBirth: child?.dateOfBirth ?? "",
    startDate: child?.startDate ?? "",
    room: child?.room ?? "",
    medicalNotes: child?.medicalNotes ?? "",
    dietaryNeeds: child?.dietaryNeeds ?? "",
    emergencyNotes: child?.emergencyNotes ?? "",
    keyPersonId: child?.keyPersonId ?? "",
  })

  const submit = () =>
    startTransition(async () => {
      const payload = {
        ...form,
        room: form.room || null,
        medicalNotes: form.medicalNotes || null,
        dietaryNeeds: form.dietaryNeeds || null,
        emergencyNotes: form.emergencyNotes || null,
        keyPersonId: form.keyPersonId || null,
      }
      const res = isEdit
        ? await updateChild({ ...payload, id: child!.id })
        : await createChild(payload)
      if (res.ok) {
        toast({ variant: "success", title: isEdit ? "Child updated" : "Child added" })
        setOpen(false)
        if (!isEdit) setForm(emptyForm)
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  const valid =
    form.firstName.trim() && form.lastName.trim() && form.dateOfBirth && form.startDate

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            {triggerLabel ?? "Edit Details"}
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {triggerLabel ?? "Add Child"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Details" : "Add Child"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="e.g. Ava" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="e.g. Smith" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Room/Group</Label>
              <Input id="room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Toddlers" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyPersonId">Key person</Label>
              <select id="keyPersonId" className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm" value={form.keyPersonId} onChange={(e) => setForm({ ...form, keyPersonId: e.target.value })}>
                <option value="">None</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dietaryNeeds">Dietary needs</Label>
            <Textarea id="dietaryNeeds" value={form.dietaryNeeds} onChange={(e) => setForm({ ...form, dietaryNeeds: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medical notes</Label>
            <Textarea id="medicalNotes" value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyNotes">Emergency notes</Label>
            <Textarea id="emergencyNotes" value={form.emergencyNotes} onChange={(e) => setForm({ ...form, emergencyNotes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add child"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

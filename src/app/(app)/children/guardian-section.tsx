"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Plus, Pencil, Trash2, Mail, Phone, Star } from "lucide-react"
import {
  addGuardian,
  updateGuardian,
  removeGuardian,
  setPrimaryGuardian,
} from "./actions"

interface GuardianData {
  id: string
  firstName: string
  lastName: string
  relationship: string
  email: string | null
  phone: string | null
  preferredChannel: string
  pickupPermission: boolean
  isPrimary: boolean
}

const CHANNELS = [
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
]

function GuardianFormDialog({
  childId,
  guardian,
}: {
  childId: string
  guardian?: GuardianData
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!guardian

  const [form, setForm] = useState({
    firstName: guardian?.firstName ?? "",
    lastName: guardian?.lastName ?? "",
    relationship: guardian?.relationship ?? "",
    email: guardian?.email ?? "",
    phone: guardian?.phone ?? "",
    preferredChannel: guardian?.preferredChannel ?? "EMAIL",
    pickupPermission: guardian?.pickupPermission ?? true,
    isPrimary: guardian?.isPrimary ?? false,
  })

  const submit = () =>
    startTransition(async () => {
      const base = {
        firstName: form.firstName,
        lastName: form.lastName,
        relationship: form.relationship,
        email: form.email || null,
        phone: form.phone || null,
        preferredChannel: form.preferredChannel as "EMAIL" | "WHATSAPP",
        pickupPermission: form.pickupPermission,
        isPrimary: form.isPrimary,
      }
      const res = isEdit
        ? await updateGuardian({ ...base, guardianId: guardian!.id })
        : await addGuardian({ ...base, childId })
      if (res.ok) {
        toast({ variant: "success", title: isEdit ? "Guardian updated" : "Guardian added" })
        setOpen(false)
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  const valid = form.firstName.trim() && form.lastName.trim() && form.relationship.trim()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add guardian
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Guardian" : "Add Guardian"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gFirstName">First name</Label>
              <Input id="gFirstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gLastName">Last name</Label>
              <Input id="gLastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gRelationship">Relationship</Label>
            <Input id="gRelationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="e.g. Mother" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gEmail">Email</Label>
              <Input id="gEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gPhone">Phone</Label>
              <Input id="gPhone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gChannel">Preferred channel</Label>
              <select id="gChannel" className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm" value={form.preferredChannel} onChange={(e) => setForm({ ...form, preferredChannel: e.target.value })}>
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gPickup">Pickup permission</Label>
              <select id="gPickup" className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm" value={form.pickupPermission ? "yes" : "no"} onChange={(e) => setForm({ ...form, pickupPermission: e.target.value === "yes" })}>
                <option value="yes">Allowed</option>
                <option value="no">Not allowed</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 border-2 border-black" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
            Primary guardian
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add guardian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SetPrimaryButton({ childId, guardianId }: { childId: string; guardianId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setPrimaryGuardian({ childId, guardianId })
          if (res.ok) {
            toast({ variant: "success", title: "Primary guardian updated" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      <Star className="h-4 w-4 mr-1" />
      {pending ? "…" : "Set primary"}
    </Button>
  )
}

function RemoveGuardianButton({ childId, guardianId }: { childId: string; guardianId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remove this guardian from the child?")) return
        startTransition(async () => {
          const res = await removeGuardian({ childId, guardianId })
          if (res.ok) {
            toast({ variant: "success", title: "Guardian removed" })
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

export function GuardianSection({
  childId,
  guardians,
}: {
  childId: string
  guardians: GuardianData[]
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Guardians &amp; Contacts</CardTitle>
          <GuardianFormDialog childId={childId} />
        </div>
      </CardHeader>
      <CardContent>
        {guardians.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No guardians linked</p>
        ) : (
          <div className="space-y-4">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="border-2 border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">
                      {guardian.firstName} {guardian.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{guardian.relationship}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {guardian.isPrimary && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                    <GuardianFormDialog childId={childId} guardian={guardian} />
                    <RemoveGuardianButton childId={childId} guardianId={guardian.id} />
                  </div>
                </div>
                <div className="space-y-2">
                  {guardian.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{guardian.email}</span>
                    </div>
                  )}
                  {guardian.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{guardian.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-600">
                      Preferred: {guardian.preferredChannel}
                    </span>
                    <Badge variant={guardian.pickupPermission ? "success" : "secondary"} className="text-xs">
                      {guardian.pickupPermission ? "Pickup allowed" : "No pickup"}
                    </Badge>
                  </div>
                  {!guardian.isPrimary && (
                    <div className="pt-1">
                      <SetPrimaryButton childId={childId} guardianId={guardian.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

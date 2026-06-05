"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { Users, Trash2 } from "lucide-react"
import {
  updateOrganisation,
  updateSchedule,
  createUser,
  updateUserRole,
  deleteUser,
} from "./actions"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
const APPROVERS = [
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "ADMIN", label: "Admin" },
]
const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "STAFF", label: "Staff" },
]

const selectClass =
  "flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm"

// ============================================
// ORGANISATION DETAILS
// ============================================

export function OrganisationForm({
  organisation,
}: {
  organisation: { name: string; address: string | null; email: string | null; phone: string | null }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: organisation.name,
    address: organisation.address ?? "",
    email: organisation.email ?? "",
    phone: organisation.phone ?? "",
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateOrganisation({
        name: form.name,
        address: form.address || null,
        email: form.email || null,
        phone: form.phone || null,
      })
      if (res.ok) {
        toast({ variant: "success", title: "Organisation updated" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="name">Organisation Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunshine Nursery" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@nursery.co.uk" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="020 1234 5678" />
        </div>
      </div>
      <div className="pt-4 border-t">
        <Button type="submit" disabled={pending || !form.name.trim()}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// DAILY UPDATES SCHEDULE
// ============================================

export function ScheduleForm({
  scheduleTime,
  scheduleDays,
  defaultApprover,
}: {
  scheduleTime: string
  scheduleDays: string[]
  defaultApprover: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [time, setTime] = useState(scheduleTime || "17:00")
  const [days, setDays] = useState<string[]>(scheduleDays)
  const [approver, setApprover] = useState(defaultApprover || "SUPERVISOR")

  const toggleDay = (day: string) =>
    setDays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateSchedule({
        dailyUpdateScheduleTime: time,
        dailyUpdateScheduleDays: DAYS.filter((d) => days.includes(d)),
        dailyUpdateDefaultApprover: approver as "SUPERVISOR" | "ADMIN",
      })
      if (res.ok) {
        toast({ variant: "success", title: "Schedule updated" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="scheduleTime">Scheduled Send Time</Label>
        <Input id="scheduleTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <p className="text-xs text-gray-600">
          Approved daily updates will be sent at this time each day
        </p>
      </div>

      <div className="space-y-2">
        <Label>Send Days</Label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((day) => (
            <label key={day} className="cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={days.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <Badge variant={days.includes(day) ? "default" : "outline"} className="cursor-pointer">
                {day}
              </Badge>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-600">
          Current: {DAYS.filter((d) => days.includes(d)).join(", ") || "None selected"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultApprover">Default Approver Role</Label>
        <select id="defaultApprover" className={selectClass} value={approver} onChange={(e) => setApprover(e.target.value)}>
          {APPROVERS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <p className="text-xs text-gray-600">
          Tasks for approving daily updates will be assigned to this role
        </p>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Schedule Settings"}
        </Button>
      </div>
    </form>
  )
}

// ============================================
// USER MANAGEMENT
// ============================================

export function AddUserDialog() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" })

  const submit = () =>
    startTransition(async () => {
      const res = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as "OWNER" | "ADMIN" | "SUPERVISOR" | "STAFF",
      })
      if (res.ok) {
        toast({ variant: "success", title: "User added" })
        setOpen(false)
        setForm({ name: "", email: "", password: "", role: "STAFF" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Something went wrong", description: res.error })
      }
    })

  const valid = form.name.trim() && form.email.trim() && form.password.length >= 8

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uName">Name</Label>
            <Input id="uName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uEmail">Email</Label>
            <Input id="uEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@nursery.co.uk" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uPassword">Password</Label>
            <Input id="uPassword" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uRole">Role</Label>
            <select id="uRole" className={selectClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? "Saving…" : "Add user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  return (
    <select
      className="h-9 rounded-md border-2 border-black bg-white px-2 text-sm"
      value={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value
        startTransition(async () => {
          const res = await updateUserRole({
            userId,
            role: next as "OWNER" | "ADMIN" | "SUPERVISOR" | "STAFF",
          })
          if (res.ok) {
            toast({ variant: "success", title: "Role updated" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }}
    >
      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  )
}

export function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remove this user? This cannot be undone.")) return
        startTransition(async () => {
          const res = await deleteUser(userId)
          if (res.ok) {
            toast({ variant: "success", title: "User removed" })
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

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
import { createTask, updateTask } from "./actions"

interface UserOption {
  id: string
  name: string
}

interface TaskData {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  dueDate: string | null // yyyy-mm-dd
  assignedToId: string | null
}

const CATEGORIES = [
  { value: "ADMIN", label: "Admin" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "FINANCE", label: "Finance" },
  { value: "PARENT_UPDATES", label: "Parent Updates" },
]

const STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function TaskFormDialog({ users, task }: { users: UserOption[]; task?: TaskData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isEdit = !!task

  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    category: task?.category ?? "ADMIN",
    status: task?.status ?? "PENDING",
    dueDate: task?.dueDate ?? "",
    assignedToId: task?.assignedToId ?? "",
  })

  const submit = () =>
    startTransition(async () => {
      const payload = {
        ...form,
        description: form.description || null,
        dueDate: form.dueDate || null,
        assignedToId: form.assignedToId || null,
      }
      const res = isEdit
        ? await updateTask({ ...payload, id: task!.id })
        : await createTask(payload)
      if (res.ok) {
        toast({ variant: "success", title: isEdit ? "Task updated" : "Task created" })
        setOpen(false)
        if (!isEdit) setForm({ title: "", description: "", category: "ADMIN", status: "PENDING", dueDate: "", assignedToId: "" })
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
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Renew first aid certificate" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign to</Label>
              <select id="assignee" className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending || !form.title.trim()}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

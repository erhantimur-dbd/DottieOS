"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { checkIn, checkOut, setAttendanceStatus } from "./actions"

const STATUSES = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "SICK", label: "Sick" },
]

export function CheckInButton({ childId, date }: { childId: string; date: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await checkIn({ childId, date })
          if (res.ok) {
            toast({ variant: "success", title: "Checked in" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      {pending ? "…" : "Check In"}
    </Button>
  )
}

export function CheckOutButton({ childId, date }: { childId: string; date: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await checkOut({ childId, date })
          if (res.ok) {
            toast({ variant: "success", title: "Checked out" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }
    >
      {pending ? "…" : "Check Out"}
    </Button>
  )
}

export function AttendanceStatusSelect({
  childId,
  date,
  status,
}: {
  childId: string
  date: string
  status: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  return (
    <select
      className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm disabled:opacity-50"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value
        startTransition(async () => {
          const res = await setAttendanceStatus({ childId, date, status: next })
          if (res.ok) {
            toast({ variant: "success", title: "Status updated" })
            router.refresh()
          } else {
            toast({ variant: "error", title: "Error", description: res.error })
          }
        })
      }}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}

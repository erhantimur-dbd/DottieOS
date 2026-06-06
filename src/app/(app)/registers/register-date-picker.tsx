"use client"

import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

export function RegisterDatePicker({ date }: { date: string }) {
  const router = useRouter()
  return (
    <Input
      type="date"
      className="w-44"
      value={date}
      onChange={(e) => {
        const next = e.target.value
        if (next) router.push(`/registers?date=${next}`)
      }}
    />
  )
}

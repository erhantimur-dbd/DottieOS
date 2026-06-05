"use client"

import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { GlobalSearch } from "./global-search"

export function Header() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <header className="border-b-2 border-black bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <GlobalSearch />
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-600">{session.user.email}</p>
          </div>
          <Badge variant="default">{session.user.role}</Badge>
        </div>
      </div>
    </header>
  )
}

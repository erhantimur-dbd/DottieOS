"use client"

import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <header className="border-b-2 border-black bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-600">
            {session.user.organisationName}
          </h2>
        </div>
        <div className="flex items-center gap-4">
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

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  FileCheck,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  Shield,
  Settings,
  History,
  LogOut
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Role = "OWNER" | "ADMIN" | "SUPERVISOR" | "STAFF"

const navigationItems: { name: string; href: string; icon: typeof Users; roles?: Role[] }[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Children", href: "/children", icon: Users },
  { name: "Registers", href: "/registers", icon: ClipboardList },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Consents", href: "/consents", icon: FileCheck },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Daily Updates", href: "/daily-updates", icon: MessageSquare },
  { name: "Evidence Vault", href: "/evidence-vault", icon: Shield },
  { name: "Audit Log", href: "/audit-log", icon: History, roles: ["OWNER", "ADMIN"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["OWNER", "ADMIN"] },
]

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const items = navigationItems.filter((item) => !item.roles || (role && item.roles.includes(role)))

  return (
    <div className="flex h-full flex-col border-r-2 border-black bg-white">
      <div className="p-6 border-b-2 border-black">
        <h1 className="text-2xl font-bold">Dottie OS</h1>
        <p className="text-xs text-gray-600 mt-1">Childcare Admin</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-black text-white"
                  : "text-black hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t-2 border-black">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

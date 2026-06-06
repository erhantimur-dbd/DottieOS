import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { History, Search } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import type { Prisma } from "@prisma/client"

const ACTION_VARIANTS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVE: "bg-purple-100 text-purple-800",
  SEND: "bg-black text-white",
  STATUS: "bg-orange-100 text-orange-800",
  LOGIN: "bg-gray-100 text-gray-800",
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; q?: string }>
}) {
  const user = await requireAuth()
  const { action, entity, q } = await searchParams

  const where: Prisma.AuditLogWhereInput = { organisationId: user.organisationId }
  if (action) where.action = action
  if (entity) where.entityType = entity
  if (q) where.summary = { contains: q, mode: "insensitive" }

  const [logs, actions, entities, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.auditLog.findMany({
      where: { organisationId: user.organisationId },
      select: { action: true },
      distinct: ["action"],
    }),
    prisma.auditLog.findMany({
      where: { organisationId: user.organisationId },
      select: { entityType: true },
      distinct: ["entityType"],
    }),
    prisma.auditLog.count({ where: { organisationId: user.organisationId } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-7 w-7" />
            Audit Log
          </h1>
          <p className="text-gray-600 mt-1">
            A complete record of changes across your organisation ({total} entries)
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q ?? ""} placeholder="Search descriptions…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <select id="action" name="action" defaultValue={action ?? ""} className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm">
                <option value="">All actions</option>
                {actions.map((a) => (
                  <option key={a.action} value={a.action}>{a.action}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity">Type</Label>
              <select id="entity" name="entity" defaultValue={entity ?? ""} className="flex h-10 w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm">
                <option value="">All types</option>
                {entities.map((e) => (
                  <option key={e.entityType} value={e.entityType}>{e.entityType}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Apply filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-600 text-center py-12">No audit entries match these filters.</p>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 py-3">
                  <Badge className={ACTION_VARIANTS[log.action] ?? "bg-gray-100 text-gray-800"}>
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.summary}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {log.entityType} • {log.actorName} • {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

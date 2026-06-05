import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { toCsv, csvResponse } from "@/lib/export/csv"
import { formatDate, formatTime } from "@/lib/utils"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dateParam = req.nextUrl.searchParams.get("date")
  const day = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date()
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()))
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  const records = await prisma.attendance.findMany({
    where: { organisationId: user.organisationId, date: { gte: start, lt: end } },
    include: { child: true },
    orderBy: { child: { firstName: "asc" } },
  })

  const csv = toCsv(records, [
    { header: "Child", value: (r) => `${r.child.firstName} ${r.child.lastName}` },
    { header: "Room", value: (r) => r.child.room ?? "" },
    { header: "Date", value: (r) => formatDate(r.date) },
    { header: "Status", value: (r) => r.status },
    { header: "Check in", value: (r) => (r.checkInTime ? formatTime(r.checkInTime) : "") },
    { header: "Check out", value: (r) => (r.checkOutTime ? formatTime(r.checkOutTime) : "") },
    { header: "Notes", value: (r) => r.notes ?? "" },
  ])

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name ?? user.email ?? "Unknown",
    action: "EXPORT",
    entityType: "Attendance",
    summary: `Exported attendance for ${formatDate(start)} (${records.length} records)`,
  })

  return csvResponse(csv, `attendance-${formatDate(start).replace(/\//g, "-")}.csv`)
}

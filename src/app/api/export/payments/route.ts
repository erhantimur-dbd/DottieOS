import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { recordAudit } from "@/lib/audit"
import { toCsv, csvResponse } from "@/lib/export/csv"
import { formatDate } from "@/lib/utils"

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get("status") // optional UNPAID|PAID|OVERDUE

  const invoices = await prisma.paymentInvoice.findMany({
    where: {
      organisationId: user.organisationId,
      ...(status ? { status: status as "UNPAID" | "PAID" | "OVERDUE" } : {}),
    },
    include: { child: true },
    orderBy: { dueDate: "asc" },
  })

  const csv = toCsv(invoices, [
    { header: "Child", value: (r) => `${r.child.firstName} ${r.child.lastName}` },
    { header: "Description", value: (r) => r.description ?? "" },
    { header: "Amount (GBP)", value: (r) => r.amount.toFixed(2) },
    { header: "Status", value: (r) => r.status },
    { header: "Due date", value: (r) => formatDate(r.dueDate) },
    { header: "Paid date", value: (r) => (r.paidDate ? formatDate(r.paidDate) : "") },
    { header: "Reminder sent", value: (r) => (r.reminderSentAt ? formatDate(r.reminderSentAt) : "") },
  ])

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name ?? user.email ?? "Unknown",
    action: "EXPORT",
    entityType: "PaymentInvoice",
    summary: `Exported payments${status ? ` (${status})` : ""} (${invoices.length} invoices)`,
  })

  return csvResponse(csv, `payments-${status ? status.toLowerCase() + "-" : ""}export.csv`)
}

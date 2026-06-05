"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { sendMessage } from "@/lib/messaging"
import { getActionUser, parseInput, err, ok, type ActionResult } from "@/lib/action-utils"

const createSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().max(2000).optional().nullable(),
})

export async function createInvoice(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(createSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const dueDate = new Date(d.dueDate)
  const status = dueDate.getTime() < Date.now() ? "OVERDUE" : "UNPAID"

  const invoice = await prisma.paymentInvoice.create({
    data: {
      childId: d.childId,
      amount: d.amount,
      dueDate,
      description: d.description || null,
      status,
      organisationId: user.organisationId,
      createdById: user.id,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "PaymentInvoice",
    entityId: invoice.id,
    summary: `Created invoice of £${d.amount.toFixed(2)} for ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/payments")
  return ok()
}

export async function markPaid(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const existing = await prisma.paymentInvoice.findFirst({
    where: { id, organisationId: user.organisationId },
    include: { child: true },
  })
  if (!existing) return err("Invoice not found")

  await prisma.paymentInvoice.update({
    where: { id },
    data: { status: "PAID", paidDate: new Date() },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "PaymentInvoice",
    entityId: id,
    summary: `Marked invoice for ${existing.child.firstName} ${existing.child.lastName} as paid`,
  })

  revalidatePath("/payments")
  return ok()
}

export async function sendReminder(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const invoice = await prisma.paymentInvoice.findFirst({
    where: { id, organisationId: user.organisationId },
    include: {
      child: { include: { guardians: { include: { guardian: true } } } },
    },
  })
  if (!invoice) return err("Invoice not found")

  const child = invoice.child
  const guardians = child.guardians

  if (guardians.length === 0) {
    return err("No guardians on file for this child")
  }

  const dueDateStr = invoice.dueDate.toLocaleDateString("en-GB")
  const isOverdue = invoice.status === "OVERDUE" || invoice.dueDate.getTime() < Date.now()

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const link of guardians) {
    const guardian = link.guardian
    const channel = guardian.preferredChannel
    const to = channel === "EMAIL" ? guardian.email : guardian.phone

    const subject = `Payment reminder for ${child.firstName} ${child.lastName}`
    const content = `Dear ${guardian.firstName}, this is a ${
      isOverdue ? "reminder that an overdue payment" : "reminder that a payment"
    } of £${invoice.amount.toFixed(2)}${
      invoice.description ? ` (${invoice.description})` : ""
    } for ${child.firstName} ${child.lastName} ${
      isOverdue ? "was due" : "is due"
    } on ${dueDateStr}. Please arrange payment at your earliest convenience. Thank you, ${user.organisationName}.`

    if (!to) {
      skipped++
      await prisma.outboundMessageLog.create({
        data: {
          childId: child.id,
          guardianId: guardian.id,
          channel,
          content,
          status: "SKIPPED",
          failureReason: `No ${channel === "EMAIL" ? "email" : "phone"} on file`,
          organisationId: user.organisationId,
        },
      })
      continue
    }

    const result = await sendMessage({ channel, to, subject, content })

    await prisma.outboundMessageLog.create({
      data: {
        childId: child.id,
        guardianId: guardian.id,
        channel,
        content,
        status: result.ok ? "SENT" : "FAILED",
        failureReason: result.ok ? null : result.error ?? "Unknown error",
        organisationId: user.organisationId,
      },
    })

    if (result.ok) sent++
    else failed++
  }

  await prisma.paymentInvoice.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "SEND",
    entityType: "PaymentInvoice",
    entityId: id,
    summary: `Sent payment reminder for ${child.firstName} ${child.lastName}: ${sent} sent, ${skipped} skipped, ${failed} failed`,
  })

  revalidatePath("/payments")
  if (sent === 0 && failed > 0) return err("Failed to send reminder")
  return ok()
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const existing = await prisma.paymentInvoice.findFirst({
    where: { id, organisationId: user.organisationId },
    include: { child: true },
  })
  if (!existing) return err("Invoice not found")

  await prisma.paymentInvoice.delete({ where: { id } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "PaymentInvoice",
    entityId: id,
    summary: `Deleted invoice for ${existing.child.firstName} ${existing.child.lastName}`,
  })

  revalidatePath("/payments")
  return ok()
}

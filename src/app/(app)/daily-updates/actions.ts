"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { compileDailyUpdate, hasContent } from "@/lib/daily-updates/compile"
import { deliverDailyUpdate } from "@/lib/daily-updates/send"
import {
  getActionUser,
  parseInput,
  err,
  ok,
  requireSupervisor,
  type ActionResult,
} from "@/lib/action-utils"

const noteSchema = z.object({
  childId: z.string().min(1),
  date: z.string().min(1),
  wellbeing: z.string().max(2000).optional().nullable(),
  meals: z.string().max(2000).optional().nullable(),
  naps: z.string().max(2000).optional().nullable(),
  toileting: z.string().max(2000).optional().nullable(),
  activities: z.string().max(2000).optional().nullable(),
  notableEvents: z.string().max(2000).optional().nullable(),
})

function parseDate(value: string): Date {
  // Date-only column; normalise to UTC midnight.
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
}

/** Upsert a child's daily note, recompile messages, and keep the DailyUpdate in sync. */
export async function saveDailyNote(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(noteSchema, input)
  if (!parsed.success) return err(parsed.error)
  const data = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: data.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const date = parseDate(data.date)
  const noteFields = {
    wellbeing: data.wellbeing ?? null,
    meals: data.meals ?? null,
    naps: data.naps ?? null,
    toileting: data.toileting ?? null,
    activities: data.activities ?? null,
    notableEvents: data.notableEvents ?? null,
  }

  const note = await prisma.dailyNote.upsert({
    where: { childId_date: { childId: child.id, date } },
    create: {
      childId: child.id,
      date,
      organisationId: user.organisationId,
      createdById: user.id,
      ...noteFields,
    },
    update: noteFields,
  })

  const compiled = compileDailyUpdate({
    child,
    note,
    organisationName: user.organisationName,
  })

  const existing = await prisma.dailyUpdate.findUnique({
    where: { childId_date: { childId: child.id, date } },
    include: { approval: true },
  })

  // Editing content after approval/sending requires re-approval.
  const revert = existing && (existing.status === "APPROVED" || existing.status === "SENT")
  if (revert && existing!.approval) {
    await prisma.dailyUpdateApproval.delete({ where: { dailyUpdateId: existing!.id } })
  }

  await prisma.dailyUpdate.upsert({
    where: { childId_date: { childId: child.id, date } },
    create: {
      childId: child.id,
      date,
      organisationId: user.organisationId,
      status: "DRAFT",
      compiledEmailContent: compiled.email,
      compiledWhatsAppContent: compiled.whatsapp,
    },
    update: {
      compiledEmailContent: compiled.email,
      compiledWhatsAppContent: compiled.whatsapp,
      ...(revert ? { status: "DRAFT", sentAt: null } : {}),
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "DailyNote",
    entityId: note.id,
    summary: `Saved daily notes for ${child.firstName} ${child.lastName}`,
  })

  revalidatePath("/daily-updates")
  revalidatePath(`/daily-updates/${child.id}/${data.date.slice(0, 10)}`)
  return ok()
}

/** Move a draft update to NEEDS_APPROVAL and create an approval task. */
export async function submitForApproval(childId: string, dateStr: string): Promise<ActionResult> {
  const user = await getActionUser()
  const date = parseDate(dateStr)

  const update = await prisma.dailyUpdate.findFirst({
    where: { childId, date, organisationId: user.organisationId },
    include: { child: true },
  })
  if (!update) return err("Save notes before submitting for approval")

  const note = await prisma.dailyNote.findUnique({
    where: { childId_date: { childId, date } },
  })
  if (!note || !hasContent(note)) return err("Add some notes before submitting")
  if (update.status === "SENT") return err("This update has already been sent")

  await prisma.dailyUpdate.update({
    where: { id: update.id },
    data: { status: "NEEDS_APPROVAL" },
  })

  // Auto-create an approval task (avoid duplicates for the same update/date).
  const existingTask = await prisma.task.findFirst({
    where: {
      organisationId: user.organisationId,
      childId,
      linkedDate: date,
      category: "PARENT_UPDATES",
      status: { not: "COMPLETED" },
    },
  })
  if (!existingTask) {
    await prisma.task.create({
      data: {
        title: `Approve daily update — ${update.child.firstName} ${update.child.lastName}`,
        description: "A daily update is waiting for supervisor approval before it can be sent.",
        category: "PARENT_UPDATES",
        status: "PENDING",
        childId,
        linkedDate: date,
        dueDate: date,
        organisationId: user.organisationId,
        createdById: user.id,
      },
    })
  }

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "STATUS",
    entityType: "DailyUpdate",
    entityId: update.id,
    summary: `Submitted daily update for ${update.child.firstName} ${update.child.lastName} for approval`,
  })

  revalidatePath("/daily-updates")
  revalidatePath("/daily-updates/approval-queue")
  revalidatePath(`/daily-updates/${childId}/${dateStr.slice(0, 10)}`)
  return ok()
}

/** Supervisor approval: record approval, set APPROVED, complete the approval task. */
export async function approveUpdate(dailyUpdateId: string): Promise<ActionResult> {
  const user = await getActionUser()
  const denied = requireSupervisor(user.role)
  if (denied) return err(denied)

  const update = await prisma.dailyUpdate.findFirst({
    where: { id: dailyUpdateId, organisationId: user.organisationId },
    include: { child: true, approval: true },
  })
  if (!update) return err("Daily update not found")
  if (update.status !== "NEEDS_APPROVAL") return err("This update is not awaiting approval")

  await prisma.dailyUpdate.update({
    where: { id: update.id },
    data: { status: "APPROVED" },
  })
  if (!update.approval) {
    await prisma.dailyUpdateApproval.create({
      data: { dailyUpdateId: update.id, approvedById: user.id },
    })
  }

  // Complete the matching approval task.
  await prisma.task.updateMany({
    where: {
      organisationId: user.organisationId,
      childId: update.childId,
      linkedDate: update.date,
      category: "PARENT_UPDATES",
      status: { not: "COMPLETED" },
    },
    data: { status: "COMPLETED" },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "APPROVE",
    entityType: "DailyUpdate",
    entityId: update.id,
    summary: `Approved daily update for ${update.child.firstName} ${update.child.lastName}`,
  })

  revalidatePath("/daily-updates")
  revalidatePath("/daily-updates/approval-queue")
  return ok()
}

/** Send an approved update immediately to all guardians. */
export async function sendUpdateNow(dailyUpdateId: string): Promise<ActionResult> {
  const user = await getActionUser()
  const denied = requireSupervisor(user.role)
  if (denied) return err(denied)

  const update = await prisma.dailyUpdate.findFirst({
    where: { id: dailyUpdateId, organisationId: user.organisationId },
  })
  if (!update) return err("Daily update not found")
  if (update.status !== "APPROVED") return err("Only approved updates can be sent")

  const summary = await deliverDailyUpdate(update.id, { id: user.id, name: user.name })

  revalidatePath("/daily-updates")
  revalidatePath("/daily-updates/approval-queue")
  if (summary.sent === 0) {
    return err(`No messages sent (${summary.skipped} skipped, ${summary.failed} failed). Check guardian contact details.`)
  }
  return ok()
}

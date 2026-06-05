"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { getActionUser, parseInput, err, ok, requireAdmin, type ActionResult } from "@/lib/action-utils"

const STATUSES = ["MISSING", "SIGNED", "EXPIRED"] as const

// ---------- Templates ----------

const templateCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  requiresExpiry: z.boolean().optional().default(false),
})

const templateUpdateSchema = templateCreateSchema.extend({
  id: z.string().min(1),
})

export async function createTemplate(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(templateCreateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const template = await prisma.consentTemplate.create({
    data: {
      name: d.name,
      description: d.description || null,
      requiresExpiry: d.requiresExpiry ?? false,
      organisationId: user.organisationId,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "ConsentTemplate",
    entityId: template.id,
    summary: `Created consent template "${template.name}"`,
  })

  revalidatePath("/consents")
  return ok()
}

export async function updateTemplate(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(templateUpdateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.consentTemplate.findFirst({
    where: { id: d.id, organisationId: user.organisationId },
  })
  if (!existing) return err("Template not found")

  await prisma.consentTemplate.update({
    where: { id: d.id },
    data: {
      name: d.name,
      description: d.description || null,
      requiresExpiry: d.requiresExpiry ?? false,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "ConsentTemplate",
    entityId: d.id,
    summary: `Updated consent template "${d.name}"`,
  })

  revalidatePath("/consents")
  return ok()
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const existing = await prisma.consentTemplate.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Template not found")

  await prisma.consentTemplate.delete({ where: { id } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "ConsentTemplate",
    entityId: id,
    summary: `Deleted consent template "${existing.name}"`,
  })

  revalidatePath("/consents")
  return ok()
}

// ---------- Consent records ----------

const recordSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  templateId: z.string().min(1, "Template is required"),
  status: z.enum(STATUSES),
  signedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

const recordUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUSES),
  signedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export async function recordConsent(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(recordSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const template = await prisma.consentTemplate.findFirst({
    where: { id: d.templateId, organisationId: user.organisationId },
  })
  if (!template) return err("Template not found")

  // No unique constraint on (childId, templateId): find-first then create/update.
  const existing = await prisma.consentRecord.findFirst({
    where: {
      childId: d.childId,
      templateId: d.templateId,
      organisationId: user.organisationId,
    },
  })

  const data = {
    status: d.status,
    signedDate: d.signedDate ? new Date(d.signedDate) : null,
    expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
    notes: d.notes || null,
  }

  if (existing) {
    await prisma.consentRecord.update({ where: { id: existing.id }, data })
  } else {
    await prisma.consentRecord.create({
      data: {
        ...data,
        childId: d.childId,
        templateId: d.templateId,
        organisationId: user.organisationId,
        createdById: user.id,
      },
    })
  }

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: existing ? "UPDATE" : "CREATE",
    entityType: "ConsentRecord",
    entityId: existing?.id ?? null,
    summary: `${existing ? "Updated" : "Recorded"} "${template.name}" consent for ${child.firstName} ${child.lastName} (${d.status.toLowerCase()})`,
  })

  revalidatePath("/consents")
  return ok()
}

export async function updateConsentRecord(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(recordUpdateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.consentRecord.findFirst({
    where: { id: d.id, organisationId: user.organisationId },
    include: { template: true, child: true },
  })
  if (!existing) return err("Consent record not found")

  await prisma.consentRecord.update({
    where: { id: d.id },
    data: {
      status: d.status,
      signedDate: d.signedDate ? new Date(d.signedDate) : null,
      expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
      notes: d.notes || null,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "ConsentRecord",
    entityId: d.id,
    summary: `Updated "${existing.template.name}" consent for ${existing.child.firstName} ${existing.child.lastName} (${d.status.toLowerCase()})`,
  })

  revalidatePath("/consents")
  return ok()
}

"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { recordAudit } from "@/lib/audit"
import { getActionUser, parseInput, err, ok, requireAdmin, type ActionResult } from "@/lib/action-utils"

const childFields = {
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  startDate: z.string().min(1, "Start date is required"),
  room: z.string().max(100).optional().nullable(),
  medicalNotes: z.string().max(2000).optional().nullable(),
  dietaryNeeds: z.string().max(2000).optional().nullable(),
  emergencyNotes: z.string().max(2000).optional().nullable(),
  keyPersonId: z.string().optional().nullable(),
}

const createSchema = z.object(childFields)
const updateSchema = z.object({ id: z.string().min(1), ...childFields })

export async function createChild(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(createSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  if (d.keyPersonId) {
    const keyPerson = await prisma.user.findFirst({
      where: { id: d.keyPersonId, organisationId: user.organisationId },
    })
    if (!keyPerson) return err("Key person not found")
  }

  const child = await prisma.child.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: new Date(d.dateOfBirth),
      startDate: new Date(d.startDate),
      room: d.room || null,
      medicalNotes: d.medicalNotes || null,
      dietaryNeeds: d.dietaryNeeds || null,
      emergencyNotes: d.emergencyNotes || null,
      keyPersonId: d.keyPersonId || null,
      organisationId: user.organisationId,
      createdById: user.id,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "Child",
    entityId: child.id,
    summary: `Added child "${child.firstName} ${child.lastName}"`,
  })

  revalidatePath("/children")
  return ok()
}

export async function updateChild(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(updateSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.child.findFirst({
    where: { id: d.id, organisationId: user.organisationId },
  })
  if (!existing) return err("Child not found")

  if (d.keyPersonId) {
    const keyPerson = await prisma.user.findFirst({
      where: { id: d.keyPersonId, organisationId: user.organisationId },
    })
    if (!keyPerson) return err("Key person not found")
  }

  await prisma.child.update({
    where: { id: d.id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: new Date(d.dateOfBirth),
      startDate: new Date(d.startDate),
      room: d.room || null,
      medicalNotes: d.medicalNotes || null,
      dietaryNeeds: d.dietaryNeeds || null,
      emergencyNotes: d.emergencyNotes || null,
      keyPersonId: d.keyPersonId || null,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Child",
    entityId: d.id,
    summary: `Updated child "${d.firstName} ${d.lastName}"`,
  })

  revalidatePath("/children")
  revalidatePath(`/children/${d.id}`)
  return ok()
}

export async function deleteChild(id: string): Promise<ActionResult> {
  const user = await getActionUser()
  const adminErr = requireAdmin(user.role)
  if (adminErr) return err(adminErr)

  const existing = await prisma.child.findFirst({
    where: { id, organisationId: user.organisationId },
  })
  if (!existing) return err("Child not found")

  await prisma.child.delete({ where: { id } })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "Child",
    entityId: id,
    summary: `Deleted child "${existing.firstName} ${existing.lastName}"`,
  })

  revalidatePath("/children")
  return ok()
}

// ============================================
// GUARDIANS
// ============================================

const CHANNELS = ["EMAIL", "WHATSAPP"] as const

const guardianFields = {
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  relationship: z.string().min(1, "Relationship is required").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  phone: z.string().max(50).optional().nullable(),
  preferredChannel: z.enum(CHANNELS),
  pickupPermission: z.boolean(),
  isPrimary: z.boolean(),
}

const addGuardianSchema = z.object({ childId: z.string().min(1), ...guardianFields })
const updateGuardianSchema = z.object({ guardianId: z.string().min(1), ...guardianFields })

export async function addGuardian(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(addGuardianSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const guardian = await prisma.guardian.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      relationship: d.relationship,
      email: d.email || null,
      phone: d.phone || null,
      preferredChannel: d.preferredChannel,
      pickupPermission: d.pickupPermission,
      organisationId: user.organisationId,
    },
  })

  // If this guardian is primary, demote existing primary links for this child.
  if (d.isPrimary) {
    await prisma.childGuardian.updateMany({
      where: { childId: d.childId, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  await prisma.childGuardian.create({
    data: {
      childId: d.childId,
      guardianId: guardian.id,
      isPrimary: d.isPrimary,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "CREATE",
    entityType: "Guardian",
    entityId: guardian.id,
    summary: `Added guardian "${guardian.firstName} ${guardian.lastName}" to ${child.firstName} ${child.lastName}`,
  })

  revalidatePath(`/children/${d.childId}`)
  return ok()
}

export async function updateGuardian(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(updateGuardianSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const existing = await prisma.guardian.findFirst({
    where: { id: d.guardianId, organisationId: user.organisationId },
  })
  if (!existing) return err("Guardian not found")

  await prisma.guardian.update({
    where: { id: d.guardianId },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      relationship: d.relationship,
      email: d.email || null,
      phone: d.phone || null,
      preferredChannel: d.preferredChannel,
      pickupPermission: d.pickupPermission,
    },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Guardian",
    entityId: d.guardianId,
    summary: `Updated guardian "${d.firstName} ${d.lastName}"`,
  })

  revalidatePath("/children")
  return ok()
}

const childGuardianSchema = z.object({
  childId: z.string().min(1),
  guardianId: z.string().min(1),
})

export async function removeGuardian(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(childGuardianSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const guardian = await prisma.guardian.findFirst({
    where: { id: d.guardianId, organisationId: user.organisationId },
    include: { _count: { select: { children: true } } },
  })
  if (!guardian) return err("Guardian not found")

  await prisma.childGuardian.deleteMany({
    where: { childId: d.childId, guardianId: d.guardianId },
  })

  // If the guardian is no longer linked to any child, delete the guardian record.
  if (guardian._count.children <= 1) {
    await prisma.guardian.delete({ where: { id: d.guardianId } })
  }

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "DELETE",
    entityType: "Guardian",
    entityId: d.guardianId,
    summary: `Removed guardian "${guardian.firstName} ${guardian.lastName}" from ${child.firstName} ${child.lastName}`,
  })

  revalidatePath(`/children/${d.childId}`)
  return ok()
}

export async function setPrimaryGuardian(input: unknown): Promise<ActionResult> {
  const user = await getActionUser()
  const parsed = parseInput(childGuardianSchema, input)
  if (!parsed.success) return err(parsed.error)
  const d = parsed.data

  const child = await prisma.child.findFirst({
    where: { id: d.childId, organisationId: user.organisationId },
  })
  if (!child) return err("Child not found")

  const link = await prisma.childGuardian.findUnique({
    where: { childId_guardianId: { childId: d.childId, guardianId: d.guardianId } },
    include: { guardian: true },
  })
  if (!link || link.guardian.organisationId !== user.organisationId) {
    return err("Guardian not linked to this child")
  }

  await prisma.childGuardian.updateMany({
    where: { childId: d.childId, isPrimary: true },
    data: { isPrimary: false },
  })
  await prisma.childGuardian.update({
    where: { childId_guardianId: { childId: d.childId, guardianId: d.guardianId } },
    data: { isPrimary: true },
  })

  await recordAudit({
    organisationId: user.organisationId,
    actorId: user.id,
    actorName: user.name,
    action: "UPDATE",
    entityType: "Guardian",
    entityId: d.guardianId,
    summary: `Set "${link.guardian.firstName} ${link.guardian.lastName}" as primary guardian for ${child.firstName} ${child.lastName}`,
  })

  revalidatePath(`/children/${d.childId}`)
  return ok()
}

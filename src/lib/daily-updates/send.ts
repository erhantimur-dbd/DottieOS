import { prisma } from "@/lib/prisma"
import { sendMessage } from "@/lib/messaging"
import { recordAudit } from "@/lib/audit"

interface Actor {
  id: string | null
  name: string
}

export interface SendSummary {
  sent: number
  failed: number
  skipped: number
}

/**
 * Deliver an approved daily update to every linked guardian via their preferred
 * channel, writing an OutboundMessageLog row per attempt and advancing the update
 * status. Shared by the "Send now" server action and the scheduled cron job.
 *
 * Guardians with no contact detail for their channel are SKIPPED (logged). The
 * update is marked SENT if at least one message went out, otherwise FAILED.
 */
export async function deliverDailyUpdate(dailyUpdateId: string, actor: Actor): Promise<SendSummary> {
  const update = await prisma.dailyUpdate.findUnique({
    where: { id: dailyUpdateId },
    include: {
      child: { include: { guardians: { include: { guardian: true } } } },
    },
  })

  if (!update) {
    throw new Error("Daily update not found")
  }

  const summary: SendSummary = { sent: 0, failed: 0, skipped: 0 }

  for (const link of update.child.guardians) {
    const guardian = link.guardian
    const channel = guardian.preferredChannel
    const to = channel === "EMAIL" ? guardian.email : guardian.phone
    const content =
      channel === "EMAIL"
        ? update.compiledEmailContent ?? ""
        : update.compiledWhatsAppContent ?? ""

    if (!to) {
      summary.skipped++
      await prisma.outboundMessageLog.create({
        data: {
          dailyUpdateId: update.id,
          childId: update.childId,
          guardianId: guardian.id,
          channel,
          content,
          status: "SKIPPED",
          failureReason: `No ${channel === "EMAIL" ? "email" : "phone"} on file`,
          organisationId: update.organisationId,
        },
      })
      continue
    }

    const result = await sendMessage({
      channel,
      to,
      subject: `Daily update for ${update.child.firstName}`,
      content,
    })

    await prisma.outboundMessageLog.create({
      data: {
        dailyUpdateId: update.id,
        childId: update.childId,
        guardianId: guardian.id,
        channel,
        content,
        status: result.ok ? "SENT" : "FAILED",
        failureReason: result.ok ? null : result.error ?? "Unknown error",
        organisationId: update.organisationId,
      },
    })

    if (result.ok) summary.sent++
    else summary.failed++
  }

  const newStatus = summary.sent > 0 ? "SENT" : "FAILED"
  await prisma.dailyUpdate.update({
    where: { id: update.id },
    data: { status: newStatus, sentAt: summary.sent > 0 ? new Date() : null },
  })

  await recordAudit({
    organisationId: update.organisationId,
    actorId: actor.id,
    actorName: actor.name,
    action: "SEND",
    entityType: "DailyUpdate",
    entityId: update.id,
    summary: `Sent daily update for ${update.child.firstName} ${update.child.lastName}: ${summary.sent} sent, ${summary.skipped} skipped, ${summary.failed} failed`,
  })

  return summary
}

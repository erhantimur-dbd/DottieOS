import { prisma } from "@/lib/prisma"

interface RecordAuditArgs {
  organisationId: string
  actorId?: string | null
  actorName: string
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "SEND" | "LOGIN" | "STATUS" | "EXPORT"
  entityType: string
  entityId?: string | null
  summary: string
}

/**
 * Write an entry to the organisation-wide audit trail. Best-effort: a failure to
 * log must never break the underlying action, so errors are swallowed (logged to
 * the server console only).
 */
export async function recordAudit(args: RecordAuditArgs): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organisationId: args.organisationId,
        actorId: args.actorId ?? null,
        actorName: args.actorName,
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId ?? null,
        summary: args.summary,
      },
    })
  } catch (err) {
    console.error("Failed to record audit log:", err)
  }
}

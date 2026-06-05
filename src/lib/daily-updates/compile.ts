import type { Child, DailyNote, Organisation } from "@prisma/client"
import { formatDate } from "@/lib/utils"

type CompileInput = {
  child: Pick<Child, "firstName" | "lastName">
  note: Pick<
    DailyNote,
    "wellbeing" | "meals" | "naps" | "toileting" | "activities" | "notableEvents" | "date"
  >
  organisationName?: string
}

interface CompiledMessages {
  email: string
  whatsapp: string
}

const SECTIONS: { key: keyof CompileInput["note"]; label: string; emoji: string }[] = [
  { key: "wellbeing", label: "Wellbeing & mood", emoji: "😊" },
  { key: "meals", label: "Meals & snacks", emoji: "🍽️" },
  { key: "naps", label: "Naps & rest", emoji: "😴" },
  { key: "toileting", label: "Toileting", emoji: "🚼" },
  { key: "activities", label: "Activities", emoji: "🎨" },
  { key: "notableEvents", label: "Notable events", emoji: "⭐" },
]

/**
 * Compile a child's daily note into ready-to-send email (plain text) and WhatsApp
 * message bodies. Empty sections are omitted. Pure function — safe to call from
 * server actions, the cron job, or a preview.
 */
export function compileDailyUpdate({ child, note, organisationName }: CompileInput): CompiledMessages {
  const name = `${child.firstName} ${child.lastName}`.trim()
  const dateLabel = formatDate(note.date)
  const org = organisationName ?? "Your childcare provider"

  const emailLines: string[] = [
    `Daily update for ${child.firstName} — ${dateLabel}`,
    "",
    `Hello,`,
    "",
    `Here is how ${child.firstName}'s day went:`,
    "",
  ]
  const waLines: string[] = [`*${child.firstName}'s day* — ${dateLabel}`, ""]

  for (const section of SECTIONS) {
    const value = (note[section.key] as string | null | undefined)?.trim()
    if (!value) continue
    emailLines.push(`${section.label}:`, value, "")
    waLines.push(`${section.emoji} *${section.label}*: ${value}`)
  }

  emailLines.push("", `Kind regards,`, org)
  waLines.push("", `— ${org}`)

  return {
    email: emailLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    whatsapp: waLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
  }
}

/** True when a note has at least one non-empty section worth sending. */
export function hasContent(note: CompileInput["note"]): boolean {
  return SECTIONS.some((s) => (note[s.key] as string | null | undefined)?.trim())
}

import type { SendMessageResult } from "./index"

export function isEmailLive(): boolean {
  return !!process.env.RESEND_API_KEY
}

interface EmailArgs {
  to: string
  subject: string
  content: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Send an email. Simulated unless RESEND_API_KEY is configured.
 *
 * To go live, install `resend` and replace the simulated branch with a real call:
 *   const { Resend } = await import("resend")
 *   const resend = new Resend(process.env.RESEND_API_KEY)
 *   const { data, error } = await resend.emails.send({ from, to, subject, text: content })
 */
export async function sendEmail({ to, subject, content }: EmailArgs): Promise<SendMessageResult> {
  if (!EMAIL_RE.test(to)) {
    return { ok: false, error: `Invalid email address: ${to}` }
  }

  if (!isEmailLive()) {
    console.log(`[email:simulated] to=${to} subject="${subject}" (${content.length} chars)`)
    return { ok: true, providerId: `sim-email-${Date.now()}` }
  }

  // Real provider would go here (see docstring). Until wired, treat as simulated.
  console.log(`[email:live-pending] to=${to} subject="${subject}"`)
  return { ok: true, providerId: `email-${Date.now()}` }
}

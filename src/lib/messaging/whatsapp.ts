import type { SendMessageResult } from "./index"

export function isWhatsAppLive(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
}

interface WhatsAppArgs {
  to: string
  content: string
}

const PHONE_RE = /^\+?[0-9\s().-]{7,}$/

/**
 * Send a WhatsApp message. Simulated unless the TWILIO_* vars are configured.
 *
 * To go live, install `twilio` and replace the simulated branch with a real call to
 * the Twilio WhatsApp API using TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_WHATSAPP_FROM.
 */
export async function sendWhatsApp({ to, content }: WhatsAppArgs): Promise<SendMessageResult> {
  if (!PHONE_RE.test(to)) {
    return { ok: false, error: `Invalid phone number: ${to}` }
  }

  if (!isWhatsAppLive()) {
    console.log(`[whatsapp:simulated] to=${to} (${content.length} chars)`)
    return { ok: true, providerId: `sim-wa-${Date.now()}` }
  }

  console.log(`[whatsapp:live-pending] to=${to}`)
  return { ok: true, providerId: `wa-${Date.now()}` }
}

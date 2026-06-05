import type { CommunicationChannel } from "@prisma/client"
import { sendEmail } from "./email"
import { sendWhatsApp } from "./whatsapp"

export interface SendMessageArgs {
  channel: CommunicationChannel
  to: string
  subject?: string
  content: string
}

export interface SendMessageResult {
  ok: boolean
  /** Provider message id when available. */
  providerId?: string
  error?: string
}

/**
 * Channel-agnostic message dispatcher. Routes to the email or WhatsApp adapter.
 *
 * By default both adapters are SIMULATED — they validate the recipient, log to the
 * server console, and report success without contacting a real provider. The result
 * is still persisted as an OutboundMessageLog row by the caller, giving a real audit
 * trail. To enable real delivery, set RESEND_API_KEY (email) and/or the TWILIO_*
 * vars (WhatsApp); the adapters pick those up without any change to call sites.
 */
export async function sendMessage(args: SendMessageArgs): Promise<SendMessageResult> {
  if (!args.to || args.to.trim() === "") {
    return { ok: false, error: "No recipient address for this channel" }
  }
  if (args.channel === "EMAIL") {
    return sendEmail({ to: args.to, subject: args.subject ?? "Update", content: args.content })
  }
  return sendWhatsApp({ to: args.to, content: args.content })
}

export { isEmailLive } from "./email"
export { isWhatsAppLive } from "./whatsapp"

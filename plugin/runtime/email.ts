import type { SendEmail } from "@cloudflare/workers-types"

export interface EmailBindings {
  send(to: string, from: string, subject: string, body: string): Promise<void>
}

export function createEmail(email: SendEmail): EmailBindings {
  return {
    async send(to, from, subject, body) {
      await email.send({
        from,
        to,
        subject,
        content: [{ type: "text/plain", value: body }],
      })
    },
  }
}
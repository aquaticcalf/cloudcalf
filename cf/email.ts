import type { SendEmail } from "@cloudflare/workers-types"

export function createEmail(email: SendEmail) {
  return {
    send: (...args: Parameters<SendEmail["send"]>) => email.send(...args),
  }
}

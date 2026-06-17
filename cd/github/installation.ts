import type { Webhooks } from "@octokit/webhooks"
import type { NormalizedWebhookPayload } from "../types"

export function registerInstallationHandler(
  webhooks: Webhooks,
  emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
) {
  webhooks.on("installation", async ({ payload }) => {
    await emitEvent({
      provider: "github",
      type: "installation",
      action: payload.action,
      repository: { id: "", fullName: "" },
      rawPayload: payload,
    })
  })
}

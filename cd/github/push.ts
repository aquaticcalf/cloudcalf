import type { Webhooks } from "@octokit/webhooks"
import type { NormalizedWebhookPayload } from "../types"

export function registerPushHandler(
  webhooks: Webhooks,
  emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
) {
  webhooks.on("push", async ({ payload }) => {
    await emitEvent({
      provider: "github",
      type: "push",
      repository: {
        id: payload.repository.id.toString(),
        fullName: payload.repository.full_name,
        defaultBranch: payload.repository.default_branch,
      },
      ref: payload.ref,
      rawPayload: payload,
    })
  })
}

import type { Webhooks } from "@octokit/webhooks"
import type { NormalizedWebhookPayload } from "../types"

export function registerDeleteHandler(
  webhooks: Webhooks,
  emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
) {
  webhooks.on("delete", async ({ payload }) => {
    if (payload.ref_type === "branch") {
      await emitEvent({
        provider: "github",
        type: "delete",
        repository: {
          id: payload.repository.id.toString(),
          fullName: payload.repository.full_name,
          defaultBranch: payload.repository.default_branch,
        },
        ref: payload.ref,
        rawPayload: payload,
      })
    }
  })
}

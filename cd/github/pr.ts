import type { Webhooks } from "@octokit/webhooks"
import type { NormalizedWebhookPayload } from "../types"

export function registerPullRequestHandler(
  webhooks: Webhooks,
  emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
) {
  webhooks.on("pull_request", async ({ payload }) => {
    await emitEvent({
      provider: "github",
      type: "pull_request",
      action: payload.action,
      repository: {
        id: payload.repository.id.toString(),
        fullName: payload.repository.full_name,
        defaultBranch: payload.repository.default_branch,
      },
      ref: payload.pull_request.head.ref,
      rawPayload: payload,
    })
  })
}

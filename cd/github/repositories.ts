import type { Webhooks } from "@octokit/webhooks"
import type { NormalizedWebhookPayload } from "../types"

export function registerInstallationRepositoriesHandler(
  webhooks: Webhooks,
  emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
) {
  webhooks.on("installation_repositories", async ({ payload }) => {
    await emitEvent({
      provider: "github",
      type: "installation_repositories",
      action: payload.action,
      repository: { id: "", fullName: "" },
      rawPayload: payload,
    })
  })
}

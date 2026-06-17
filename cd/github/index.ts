import { Webhooks } from "@octokit/webhooks"
import type { WebhookAdapter, NormalizedWebhookPayload } from "../types"

import { registerPullRequestHandler } from "./pr"
import { registerPushHandler } from "./push"
import { registerInstallationHandler } from "./installation"
import { registerInstallationRepositoriesHandler } from "./repositories"
import { registerDeleteHandler } from "./delete"

export function github(options: { secret: string }): WebhookAdapter {
  return {
    name: "github",

    // determines if this request came from github by checking the signature headers
    canHandle(request: Request): boolean {
      return request.headers.has("x-github-delivery") || request.headers.has("x-hub-signature-256")
    },

    // process the request and emit the normalized payloads
    async handleRequest(
      request: Request,
      emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
    ) {
      // temporarily store the emitevent function to pass it into the @octokit/webhooks event listeners
      // a cleaner way is to attach listeners just once, or pass it directly.
      // since webhooks is a single instance, we'll clear and re-attach listeners per request
      // or instantiate a fresh webhooks instance per request to avoid race conditions.
      const perRequestWebhooks = new Webhooks({ secret: options.secret })

      registerPushHandler(perRequestWebhooks, emitEvent)
      registerPullRequestHandler(perRequestWebhooks, emitEvent)
      registerInstallationHandler(perRequestWebhooks, emitEvent)
      registerInstallationRepositoriesHandler(perRequestWebhooks, emitEvent)
      registerDeleteHandler(perRequestWebhooks, emitEvent)

      const signature = request.headers.get("x-hub-signature-256") || ""
      const id = request.headers.get("x-github-delivery") || ""
      const name = request.headers.get("x-github-event") || ""
      const payload = await request.text()

      await perRequestWebhooks.verifyAndReceive({
        id,
        name: name as any,
        payload,
        signature,
      })
    },
  }
}

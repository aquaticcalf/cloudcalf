import type { WebhookHandlerOptions, NormalizedWebhookPayload } from "./types"

/**
 * creates an ergonomic web standards-compliant http handler for receiving webhooks.
 * it automatically matches the incoming request to the correct provider adapter,
 * verifies the signature, and triggers the configured event callbacks.
 */
export function createWebhookHandler(options: WebhookHandlerOptions) {
  return async (request: Request): Promise<Response> => {
    // 1. automatically find which adapter can handle this request
    const adapter = options.adapters.find((a) => a.canHandle(request))

    if (!adapter) {
      return new Response("webhook provider not recognized", { status: 400 })
    }

    try {
      // 2. delegate to the adapter to verify signature and parse payload
      await adapter.handleRequest(request, async (payload: NormalizedWebhookPayload) => {
        // 3. dispatch to the universal catch-all if provided
        if (options.onEvent) {
          await options.onEvent(payload)
        }

        // 4. dispatch to the specific event handlers
        switch (payload.type) {
          case "push":
            if (options.onPush) await options.onPush(payload)
            break
          case "pull_request":
            if (options.onPullRequest) await options.onPullRequest(payload)
            break
          case "installation":
            if (options.onInstallation) await options.onInstallation(payload)
            break
          case "installation_repositories":
            if (options.onInstallationRepositories)
              await options.onInstallationRepositories(payload)
            break
          case "delete":
            if (options.onDelete) await options.onDelete(payload)
            break
        }
      })

      return new Response("webhook processed successfully", { status: 200 })
    } catch (error: any) {
      console.error(`[${adapter.name} webhook error] : `, error)
      return new Response(error.message || "internal server error", { status: 500 })
    }
  }
}

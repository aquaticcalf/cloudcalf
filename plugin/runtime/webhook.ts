import type { RouteHandler } from "./route"

export interface WebhookContext {
  provider: string
  type: string
  repository?: { id: string; fullName: string }
  ref?: string
  raw: unknown
}

export interface WebhookHandlerOptions {
  github?: { secret: string }
}

export function createWebhookHandler(options: WebhookHandlerOptions) {
  return async (req: Request, handler: (ctx: WebhookContext) => Promise<unknown>) => {
    const provider = req.headers.get("x-github-delivery") ? "github" : null
    if (!provider) return new Response("unknown webhook provider", { status: 400 })

    const raw: any = await req.json()
    const eventType = req.headers.get("x-github-event") || ""

    return handler({
      provider,
      type: eventType,
      repository: raw.repository
        ? { id: String(raw.repository.id), fullName: raw.repository.full_name }
        : undefined,
      ref: raw.ref,
      raw,
    })
  }
}

export function webhookRoute(options: WebhookHandlerOptions): RouteHandler {
  return async (ctx) => {
    const handler = createWebhookHandler(options)
    return handler(ctx.req, async (webhookCtx) => {
      return { received: true, webhook: webhookCtx }
    })
  }
}
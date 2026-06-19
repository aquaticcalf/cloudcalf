import { Hono } from "hono"
import { createDb } from "db"
import { getCookie } from "hono/cookie"
import { Polar } from "@polar-sh/sdk"
import { validateEvent } from "@polar-sh/sdk/webhooks"

const tiers = (env: Env) => [
  {
    id: "launch",
    name: "Launch",
    credits: Number(env.POLAR_LAUNCH_CREDITS || 250000),
    productId: env.POLAR_LAUNCH_PRODUCT_ID,
  },
  {
    id: "scale",
    name: "Scale",
    credits: Number(env.POLAR_SCALE_CREDITS || 1000000),
    productId: env.POLAR_SCALE_PRODUCT_ID,
  },
  {
    id: "pro",
    name: "Pro",
    credits: Number(env.POLAR_PRO_CREDITS || 5000000),
    productId: env.POLAR_PRO_PRODUCT_ID,
  },
]

async function session(c: any) {
  const db = createDb(c.env.DB)
  const token = getCookie(c, "session")
  if (!token) return null
  const auth = await db.auth.getSession(token)
  if (!auth) return null
  return { db, userId: auth.userId, user: await db.auth.getUser(auth.userId) }
}

export function createBillingRoutes() {
  const app = new Hono<{ Bindings: Env }>()

  app.get("/", async (c) => {
    const auth = await session(c)
    if (!auth) return c.json({ error: "Unauthorized" }, 401)
    const account = await auth.db.platform.billing.get(auth.userId)
    const transactions = await auth.db.platform.billing.transactions(auth.userId)
    return c.json({
      account,
      transactions,
      tiers: tiers(c.env).map(({ productId, ...tier }) => ({
        ...tier,
        available: Boolean(productId),
      })),
      polarConfigured: Boolean(c.env.POLAR_ACCESS_TOKEN),
    })
  })

  app.post("/checkout", async (c) => {
    const auth = await session(c)
    if (!auth || !auth.user) return c.json({ error: "Unauthorized" }, 401)
    if (!c.env.POLAR_ACCESS_TOKEN) return c.json({ error: "Billing is not configured" }, 503)
    const { tier: tierId } = await c.req.json<{ tier?: string }>()
    const tier = tiers(c.env).find((candidate) => candidate.id === tierId)
    if (!tier?.productId) return c.json({ error: "This credit pack is not available" }, 400)
    const origin = new URL(c.req.url).origin
    const checkout = await new Polar({
      accessToken: c.env.POLAR_ACCESS_TOKEN,
      server: c.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
    }).checkouts.create({
      products: [tier.productId],
      externalCustomerId: auth.userId,
      customerEmail: auth.user.email,
      customerName: auth.user.name,
      allowDiscountCodes: true,
      successUrl: `${origin}/dashboard/billing?checkout=success&checkout_id={CHECKOUT_ID}`,
      returnUrl: `${origin}/dashboard/billing`,
      metadata: {
        cloudcalf_user_id: auth.userId,
        cloudcalf_tier: tier.id,
        cloudcalf_credits: tier.credits,
      },
    })
    return c.json({ url: checkout.url })
  })

  app.post("/portal", async (c) => {
    const auth = await session(c)
    if (!auth) return c.json({ error: "Unauthorized" }, 401)
    if (!c.env.POLAR_ACCESS_TOKEN) return c.json({ error: "Billing is not configured" }, 503)
    const origin = new URL(c.req.url).origin
    const portal = await new Polar({
      accessToken: c.env.POLAR_ACCESS_TOKEN,
      server: c.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
    }).customerSessions.create({
      externalCustomerId: auth.userId,
      returnUrl: `${origin}/dashboard/billing`,
    })
    return c.json({ url: portal.customerPortalUrl })
  })

  app.post("/webhook", async (c) => {
    if (!c.env.POLAR_WEBHOOK_SECRET) return c.json({ error: "Webhook is not configured" }, 503)
    const body = await c.req.text()
    const headers = Object.fromEntries(c.req.raw.headers.entries())
    let event: any
    try {
      event = validateEvent(body, headers, c.env.POLAR_WEBHOOK_SECRET)
    } catch {
      return c.json({ error: "Invalid webhook signature" }, 403)
    }
    const eventId = c.req.header("webhook-id")
    if (!eventId) return c.json({ error: "Missing webhook id" }, 400)
    const db = createDb(c.env.DB)
    if (!(await db.platform.billing.markEvent(eventId, event.type)))
      return c.json({ received: true, duplicate: true })
    if (event.type === "order.paid") {
      const userId = String(
        event.data.metadata?.cloudcalf_user_id || event.data.customer?.externalId || "",
      )
      const credits = Number(event.data.metadata?.cloudcalf_credits || 0)
      if (userId && Number.isSafeInteger(credits) && credits > 0) {
        await db.platform.billing.setPolarCustomer(userId, event.data.customerId)
        await db.platform.billing.setTier(
          userId,
          String(event.data.metadata?.cloudcalf_tier || "credits"),
        )
        await db.platform.billing.apply(
          userId,
          credits,
          "purchase",
          `${event.data.metadata?.cloudcalf_tier || "Credit"} pack`,
          `polar:order:${event.data.id}`,
        )
      }
    }
    if (event.type === "order.refunded") {
      const userId = String(
        event.data.metadata?.cloudcalf_user_id || event.data.customer?.externalId || "",
      )
      const purchasedCredits = Number(event.data.metadata?.cloudcalf_credits || 0)
      const paidAmount = Number(event.data.netAmount || event.data.totalAmount || 0)
      const refundedAmount = Number(event.data.refundedAmount || 0)
      const credits =
        paidAmount > 0
          ? Math.round(purchasedCredits * Math.min(1, refundedAmount / paidAmount))
          : purchasedCredits
      if (userId && Number.isSafeInteger(credits) && credits > 0)
        await db.platform.billing.apply(
          userId,
          -credits,
          "refund",
          "Polar order refund",
          `polar:refund:${event.data.id}:${refundedAmount}`,
        )
    }
    return c.json({ received: true })
  })

  return app
}

import { createOAuthHandler, github } from "oauth"
import { createDb } from "db"

export function createAuthRoutes() {
  return createOAuthHandler<{ Bindings: Env }>({
    providers: (c) => [
      github({
        clientId: c.env.GITHUB_CLIENT_ID,
        clientSecret: c.env.GITHUB_CLIENT_SECRET,
        redirectUri: new URL(c.req.url).origin + "/api/auth/github/callback",
      }),
    ],
    async onSuccess(user, c) {
      const db = createDb(c.env.DB)
      const session = await db.auth.authenticate({
        provider: user.provider,
        providerId: user.providerId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? undefined,
      })
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": `session=${session.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
        },
      })
    },
  })
}

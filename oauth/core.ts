import { Hono } from "hono"
import { generateState, generateCodeVerifier } from "arctic"
import type { OAuthProvider, OAuthUser } from "./types"

export interface OAuthHandlerOptions {
  providers: OAuthProvider[]
  redirectUri: string
  onSuccess(user: OAuthUser): Promise<Response> | Response
  onError?(error: Error): Response
}

export function createOAuthHandler(options: OAuthHandlerOptions) {
  const router = new Hono<{ Bindings: Record<string, unknown> }>()

  for (const provider of options.providers) {
    router.get(`/${provider.name}/login`, async (c) => {
      const state = generateState()
      const codeVerifier = generateCodeVerifier()
      const url = await provider.createAuthorizationUrl(state, ["openid", "email", "profile"])

      c.header(
        "Set-Cookie",
        `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
      )
      c.header(
        "Set-Cookie",
        `code_verifier=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        { append: true },
      )

      return c.redirect(url.toString())
    })

    router.get(`/${provider.name}/callback`, async (c) => {
      try {
        const code = c.req.query("code")
        const state = c.req.query("state")
        if (!code || !state) {
          return c.text("missing code or state", 400)
        }

        const tokens = await provider.validateAuthorizationCode(code)
        const user = await provider.getUser(tokens)
        return await options.onSuccess(user)
      } catch (error) {
        if (options.onError) return options.onError(error as Error)
        return c.text("oauth authentication failed", 401)
      }
    })
  }

  return router
}

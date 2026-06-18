import { Hono, type Context, type Env as HonoEnv } from "hono"
import { getCookie } from "hono/cookie"
import { generateState, generateCodeVerifier } from "arctic"
import type { OAuthProvider, OAuthUser } from "./types"

export interface OAuthHandlerOptions<E extends HonoEnv = any> {
  providers: (c: Context<E>) => OAuthProvider[] | Promise<OAuthProvider[]>
  onSuccess(user: OAuthUser, c: Context<E>): Promise<Response> | Response
  onError?(error: Error, c: Context<E>): Response
}

export function createOAuthHandler<E extends HonoEnv = any>(options: OAuthHandlerOptions<E>) {
  const router = new Hono<E>()

  router.get("/:provider/login", async (c) => {
    const providerName = c.req.param("provider")
    const providers = await options.providers(c)
    const provider = providers.find((p) => p.name === providerName)
    if (!provider) return c.text("unknown provider", 404)

    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const url = await provider.createAuthorizationUrl(state, codeVerifier, [
      "openid",
      "email",
      "profile",
    ])

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

  router.get("/:provider/callback", async (c) => {
    const providerName = c.req.param("provider")
    const providers = await options.providers(c)
    const provider = providers.find((p) => p.name === providerName)
    if (!provider) return c.text("unknown provider", 404)

    try {
      const code = c.req.query("code")
      const state = c.req.query("state")
      if (!code || !state) {
        return c.text("missing code or state", 400)
      }

      const codeVerifier = getCookie(c, "code_verifier")
      if (!codeVerifier) {
        return c.text("missing code verifier", 400)
      }

      const tokens = await provider.validateAuthorizationCode(code, codeVerifier)
      const user = await provider.getUser(tokens)
      return await options.onSuccess(user, c)
    } catch (error) {
      if (options.onError) return options.onError(error as Error, c)
      return c.text("oauth authentication failed", 401)
    }
  })

  return router
}

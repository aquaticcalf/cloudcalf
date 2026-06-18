import { Google } from "arctic"
import type { OAuthProvider, OAuthUser } from "../types"

export function google(options: {
  clientId: string
  clientSecret: string
  redirectUri: string
}): OAuthProvider {
  const client = new Google(options.clientId, options.clientSecret, options.redirectUri)

  return {
    name: "google",

    createAuthorizationUrl(state: string, codeVerifier: string): Promise<URL> {
      return Promise.resolve(
        client.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]),
      )
    },

    async validateAuthorizationCode(code: string, codeVerifier: string) {
      return client.validateAuthorizationCode(code, codeVerifier)
    },

    async getUser(tokens): Promise<OAuthUser> {
      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch Google user profile")
      }

      const user = (await response.json()) as any

      return {
        provider: "google",
        providerId: user.sub,
        email: user.email,
        name: user.name || user.given_name,
        avatarUrl: user.picture,
      }
    },
  }
}

import { GitHub } from "arctic"
import type { OAuthProvider, OAuthUser } from "../types"

export function github(options: {
  clientId: string
  clientSecret: string
  redirectUri: string
}): OAuthProvider {
  const client = new GitHub(options.clientId, options.clientSecret, options.redirectUri)

  return {
    name: "github",

    createAuthorizationUrl(state: string): Promise<URL> {
      return Promise.resolve(client.createAuthorizationURL(state, ["user:email"]))
    },

    async validateAuthorizationCode(code: string) {
      return client.validateAuthorizationCode(code)
    },

    async getUser(tokens): Promise<OAuthUser> {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      })

      if (!res.ok) throw new Error("failed to fetch github user")

      const data: any = await res.json()

      return {
        provider: "github",
        providerId: String(data.id),
        email: data.email || "",
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
      }
    },
  }
}

import { GitHub } from "arctic"
import { Octokit } from "octokit"
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
      const octokit = new Octokit({
        auth: tokens.accessToken(),
        userAgent: "cloudcalf",
      })

      const { data } = await octokit.rest.users.getAuthenticated()
      let email = data.email || ""

      if (!email) {
        try {
          const { data: emails } = await octokit.rest.users.listEmailsForAuthenticatedUser()
          const primaryEmail = emails.find((e) => e.primary) || emails[0]
          if (primaryEmail) {
            email = primaryEmail.email
          }
        } catch (error) {
          console.error("failed to fetch private emails : ", error)
        }
      }

      return {
        provider: "github",
        providerId: String(data.id),
        email: email,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
      }
    },
  }
}

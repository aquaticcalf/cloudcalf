import { OAuth2Tokens } from "arctic"

export interface OAuthUser {
  provider: string
  providerId: string
  email: string
  name: string
  avatarUrl?: string
}

export interface OAuthProvider {
  name: string
  createAuthorizationUrl(state: string, scopes?: string[]): Promise<URL>
  validateAuthorizationCode(code: string): Promise<OAuth2Tokens>
  getUser(tokens: OAuth2Tokens): Promise<OAuthUser>
}

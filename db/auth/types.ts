export interface User {
  id: string
  email: string
  provider: string
  providerId: string
  name: string
  avatarUrl?: string
  createdAt: Date
}

export interface Session {
  token: string
  userId: string
  expiresAt: Date
}

export interface AuthDatabase {
  findOrCreateUser(data: {
    provider: string
    providerId: string
    email: string
    name: string
    avatarUrl: string | null
  }): Promise<User>
  createSession(userId: string): Promise<Session>
  getSession(token: string): Promise<Session | null>
  deleteSession(token: string): Promise<void>
}

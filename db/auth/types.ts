export interface User {
  id: string
  email: string
}

export interface Session {
  token: string
  userId: string
  expiresAt: Date
}

export interface AuthDatabase {
  createUser(data: { email: string; password: string }): Promise<User>
  verifyUser(email: string, password: string): Promise<User>
  createSession(userId: string): Promise<Session>
  getSession(token: string): Promise<Session | null>
  deleteSession(token: string): Promise<void>
}

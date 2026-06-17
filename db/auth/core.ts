import { drizzle } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"
import { createUser, verifyUser } from "./user"
import { createSession, getSession, deleteSession } from "./session"
import type { User, Session } from "./types"

export function createAuth(d1: D1Database) {
  const db = drizzle(d1)

  return {
    async signUp(email: string, password: string): Promise<User> {
      return createUser(db, email, password)
    },
    async signIn(email: string, password: string): Promise<Session> {
      const user = await verifyUser(db, email, password)
      return createSession(db, user.id)
    },
    async getSession(token: string): Promise<Session | null> {
      return getSession(db, token)
    },
    async signOut(token: string): Promise<void> {
      return deleteSession(db, token)
    },
  }
}

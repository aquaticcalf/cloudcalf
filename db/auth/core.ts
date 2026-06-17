import { drizzle } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"
import { findOrCreateUser } from "./user"
import { createSession, getSession, deleteSession } from "./session"
import type { Session } from "./types"

export function createAuth(d1: D1Database) {
  const db = drizzle(d1)

  return {
    async authenticate(data: {
      provider: string
      providerId: string
      email: string
      name: string
      avatarUrl?: string
    }): Promise<Session> {
      const user = await findOrCreateUser(db, data)
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

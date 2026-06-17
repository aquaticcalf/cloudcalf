import { sessions } from "../schema"
import type { Session } from "../types"
import type { drizzle } from "drizzle-orm/d1"
import { withUniqueRetry } from "../lib/unique"

export async function createSession(
  db: ReturnType<typeof drizzle>,
  userId: string,
): Promise<Session> {
  return withUniqueRetry(async (token) => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    await db.insert(sessions).values({ token, userId, expiresAt })
    return { token, userId, expiresAt }
  })
}

import { eq } from "drizzle-orm"
import { sessions } from "../schema"
import { deleteSession } from "./delete"
import type { Session } from "../types"
import type { drizzle } from "drizzle-orm/d1"

export async function getSession(
  db: ReturnType<typeof drizzle>,
  token: string,
): Promise<Session | null> {
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token))
  if (!session) return null
  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteSession(db, token)
    return null
  }
  return session
}

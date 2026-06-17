import { eq } from "drizzle-orm"
import { sessions } from "../schema"
import type { Session } from "../types"
import type { drizzle } from "drizzle-orm/d1"

export async function getSession(
  db: ReturnType<typeof drizzle>,
  token: string,
): Promise<Session | null> {
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token))
  return session || null
}

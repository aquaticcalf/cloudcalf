import { eq } from "drizzle-orm"
import { sessions } from "../schema"
import type { drizzle } from "drizzle-orm/d1"

export async function deleteSession(db: ReturnType<typeof drizzle>, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token))
}

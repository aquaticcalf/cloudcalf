import { eq } from "drizzle-orm"
import type { drizzle } from "drizzle-orm/d1"
import { users } from "../schema"
import type { User } from "../types"

export async function getUser(db: ReturnType<typeof drizzle>, id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return (user as User | undefined) || null
}

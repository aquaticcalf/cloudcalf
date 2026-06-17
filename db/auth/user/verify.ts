import { eq } from "drizzle-orm"
import { users } from "../schema"
import type { User } from "../types"
import type { drizzle } from "drizzle-orm/d1"

export async function verifyUser(
  db: ReturnType<typeof drizzle>,
  email: string,
  password: string,
): Promise<User> {
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || user.password !== password) throw new Error("invalid credentials")
  return user
}

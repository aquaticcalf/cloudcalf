import { users } from "../schema"
import type { User } from "../types"
import type { drizzle } from "drizzle-orm/d1"
import { withUniqueRetry } from "../lib/unique"

export async function createUser(
  db: ReturnType<typeof drizzle>,
  email: string,
  password: string,
): Promise<User> {
  return withUniqueRetry(async (id) => {
    const [user] = await db
      .insert(users)
      .values({ id, email, password, createdAt: new Date() })
      .returning()
    return user
  })
}

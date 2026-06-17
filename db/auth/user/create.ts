import { users } from "../schema"
import type { User } from "../types"
import type { drizzle } from "drizzle-orm/d1"
import { withUniqueRetry } from "../../lib"

export async function createUser(
  db: ReturnType<typeof drizzle>,
  email: string,
  password: string,
): Promise<User> {
  return withUniqueRetry(async (id: string) => {
    const [user] = await db
      .insert(users)
      .values({ id, email, password, createdAt: new Date() })
      .returning()
    return user
  })
}

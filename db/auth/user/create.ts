import { eq, and } from "drizzle-orm"
import { users } from "../schema"
import type { User } from "../types"
import type { drizzle } from "drizzle-orm/d1"
import { withUniqueRetry } from "../../lib"

export async function findOrCreateUser(
  db: ReturnType<typeof drizzle>,
  data: {
    provider: string
    providerId: string
    email: string
    name: string
    avatarUrl?: string
  },
): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, data.provider), eq(users.providerId, data.providerId)))

  if (existing) return existing as User

  return withUniqueRetry(async (id: string) => {
    const [user] = await db
      .insert(users)
      .values({ id, ...data, avatarUrl: data.avatarUrl ?? null, createdAt: new Date() })
      .returning()
    return user as User
  })
}

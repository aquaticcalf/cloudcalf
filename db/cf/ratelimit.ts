import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const rateLimits = sqliteTable("rate_limits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  limit: integer("limit"),
  period: integer("period"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(users, { fields: [rateLimits.userId], references: [users.id] }),
}))

export function createRatelimitResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; limit?: number; period?: number },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(rateLimits)
          .values({
            id,
            userId,
            ...data,
            cloudflareId: data.cloudflareId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        return res
      })
    },
    get: async (id: string) => {
      const [res] = await db.select().from(rateLimits).where(eq(rateLimits.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(rateLimits).where(eq(rateLimits.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; limit?: number; period?: number }>,
    ) => {
      const [res] = await db
        .update(rateLimits)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(rateLimits.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(rateLimits).where(eq(rateLimits.id, id))
    },
  }
}

import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const r2Buckets = sqliteTable("r2_buckets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  locationHint: text("location_hint"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const r2BucketsRelations = relations(r2Buckets, ({ one }) => ({
  user: one(users, { fields: [r2Buckets.userId], references: [users.id] }),
}))

export function createR2Resources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; locationHint?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(r2Buckets)
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
      const [res] = await db.select().from(r2Buckets).where(eq(r2Buckets.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(r2Buckets).where(eq(r2Buckets.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; locationHint?: string }>,
    ) => {
      const [res] = await db
        .update(r2Buckets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(r2Buckets.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(r2Buckets).where(eq(r2Buckets.id, id))
    },
  }
}

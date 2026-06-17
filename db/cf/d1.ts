import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const d1Databases = sqliteTable("d1_databases", {
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

export const d1DatabasesRelations = relations(d1Databases, ({ one }) => ({
  user: one(users, { fields: [d1Databases.userId], references: [users.id] }),
}))

export function createD1Resources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; locationHint?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(d1Databases)
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
      const [res] = await db.select().from(d1Databases).where(eq(d1Databases.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(d1Databases).where(eq(d1Databases.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; locationHint?: string }>,
    ) => {
      const [res] = await db
        .update(d1Databases)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(d1Databases.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(d1Databases).where(eq(d1Databases.id, id))
    },
  }
}

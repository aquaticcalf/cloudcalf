import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const durableObjects = sqliteTable("durable_objects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  className: text("class_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const durableObjectsRelations = relations(durableObjects, ({ one }) => ({
  user: one(users, { fields: [durableObjects.userId], references: [users.id] }),
}))

export function createDurableobjectResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; className?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(durableObjects)
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
      const [res] = await db.select().from(durableObjects).where(eq(durableObjects.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(durableObjects).where(eq(durableObjects.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; className?: string }>,
    ) => {
      const [res] = await db
        .update(durableObjects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(durableObjects.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(durableObjects).where(eq(durableObjects.id, id))
    },
  }
}

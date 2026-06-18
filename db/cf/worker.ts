import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const workers = sqliteTable("workers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  observability: integer("observability", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const workersRelations = relations(workers, ({ one }) => ({
  user: one(users, { fields: [workers.userId], references: [users.id] }),
}))

export function createWorkerResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (userId: string, data: { name: string; observability?: boolean }) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(workers)
          .values({
            id,
            userId,
            name: data.name,
            observability: data.observability ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        return res
      })
    },
    get: async (id: string) => {
      const [res] = await db.select().from(workers).where(eq(workers.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(workers).where(eq(workers.userId, userId))
    },
    update: async (id: string, data: Partial<{ name: string; observability: boolean }>) => {
      const [res] = await db
        .update(workers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workers.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(workers).where(eq(workers.id, id))
    },
  }
}

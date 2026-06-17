import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const dispatchNamespaces = sqliteTable("dispatch_namespaces", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  namespace: text("namespace"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const dispatchNamespacesRelations = relations(dispatchNamespaces, ({ one }) => ({
  user: one(users, { fields: [dispatchNamespaces.userId], references: [users.id] }),
}))

export function createDispatchResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; namespace?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(dispatchNamespaces)
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
      const [res] = await db.select().from(dispatchNamespaces).where(eq(dispatchNamespaces.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(dispatchNamespaces).where(eq(dispatchNamespaces.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; namespace?: string }>,
    ) => {
      const [res] = await db
        .update(dispatchNamespaces)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(dispatchNamespaces.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(dispatchNamespaces).where(eq(dispatchNamespaces.id, id))
    },
  }
}

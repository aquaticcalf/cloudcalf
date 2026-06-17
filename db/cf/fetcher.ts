import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const serviceBindings = sqliteTable("service_bindings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  serviceName: text("service_name"),
  environment: text("environment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const serviceBindingsRelations = relations(serviceBindings, ({ one }) => ({
  user: one(users, { fields: [serviceBindings.userId], references: [users.id] }),
}))

export function createFetcherResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; serviceName?: string; environment?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(serviceBindings)
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
      const [res] = await db.select().from(serviceBindings).where(eq(serviceBindings.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(serviceBindings).where(eq(serviceBindings.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{
        name: string
        cloudflareId: string
        serviceName?: string
        environment?: string
      }>,
    ) => {
      const [res] = await db
        .update(serviceBindings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(serviceBindings.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(serviceBindings).where(eq(serviceBindings.id, id))
    },
  }
}

import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const emailRoutes = sqliteTable("email_routes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  destinationAddress: text("destination_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const emailRoutesRelations = relations(emailRoutes, ({ one }) => ({
  user: one(users, { fields: [emailRoutes.userId], references: [users.id] }),
}))

export function createEmailResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; destinationAddress?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(emailRoutes)
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
      const [res] = await db.select().from(emailRoutes).where(eq(emailRoutes.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(emailRoutes).where(eq(emailRoutes.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; destinationAddress?: string }>,
    ) => {
      const [res] = await db
        .update(emailRoutes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(emailRoutes.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(emailRoutes).where(eq(emailRoutes.id, id))
    },
  }
}

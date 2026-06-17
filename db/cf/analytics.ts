import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const analyticsDatasets = sqliteTable("analytics_datasets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const analyticsDatasetsRelations = relations(analyticsDatasets, ({ one }) => ({
  user: one(users, { fields: [analyticsDatasets.userId], references: [users.id] }),
}))

export function createAnalyticsResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; description?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(analyticsDatasets)
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
      const [res] = await db.select().from(analyticsDatasets).where(eq(analyticsDatasets.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(analyticsDatasets).where(eq(analyticsDatasets.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; description?: string }>,
    ) => {
      const [res] = await db
        .update(analyticsDatasets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(analyticsDatasets.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(analyticsDatasets).where(eq(analyticsDatasets.id, id))
    },
  }
}

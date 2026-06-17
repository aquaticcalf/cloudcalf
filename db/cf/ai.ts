import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const aiModels = sqliteTable("ai_models", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const aiModelsRelations = relations(aiModels, ({ one }) => ({
  user: one(users, { fields: [aiModels.userId], references: [users.id] }),
}))

export function createAiResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: { name: string; cloudflareId?: string; description?: string },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(aiModels)
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
      const [res] = await db.select().from(aiModels).where(eq(aiModels.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(aiModels).where(eq(aiModels.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{ name: string; cloudflareId: string; description?: string }>,
    ) => {
      const [res] = await db
        .update(aiModels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(aiModels.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(aiModels).where(eq(aiModels.id, id))
    },
  }
}

import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const vectorizeIndexes = sqliteTable("vectorize_indexes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  dimensions: integer("dimensions").notNull(),
  metric: text("metric", { enum: ["cosine", "euclidean", "dot-product"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const vectorizeIndexesRelations = relations(vectorizeIndexes, ({ one }) => ({
  user: one(users, { fields: [vectorizeIndexes.userId], references: [users.id] }),
}))

export function createVectorizeResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: {
        name: string
        cloudflareId?: string
        dimensions: number
        metric: "cosine" | "euclidean" | "dot-product"
      },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(vectorizeIndexes)
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
      const [res] = await db.select().from(vectorizeIndexes).where(eq(vectorizeIndexes.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(vectorizeIndexes).where(eq(vectorizeIndexes.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{
        name: string
        cloudflareId: string
        dimensions: number
        metric: "cosine" | "euclidean" | "dot-product"
      }>,
    ) => {
      const [res] = await db
        .update(vectorizeIndexes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(vectorizeIndexes.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(vectorizeIndexes).where(eq(vectorizeIndexes.id, id))
    },
  }
}

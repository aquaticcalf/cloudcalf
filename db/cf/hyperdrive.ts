import { relations, eq } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"
import { withUniqueRetry } from "../lib"
import type { drizzle } from "drizzle-orm/d1"

export const hyperdriveConfigs = sqliteTable("hyperdrive_configs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cloudflareId: text("cloudflare_id"),
  originHost: text("origin_host"),
  originPort: integer("origin_port"),
  originScheme: text("origin_scheme"),
  originDatabase: text("origin_database"),
  originUser: text("origin_user"),
  originPassword: text("origin_password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const hyperdriveConfigsRelations = relations(hyperdriveConfigs, ({ one }) => ({
  user: one(users, { fields: [hyperdriveConfigs.userId], references: [users.id] }),
}))

export function createHyperdriveResources(db: ReturnType<typeof drizzle>) {
  return {
    create: async (
      userId: string,
      data: {
        name: string
        cloudflareId?: string
        originHost?: string
        originPort?: number
        originScheme?: string
        originDatabase?: string
        originUser?: string
        originPassword?: string
      },
    ) => {
      return withUniqueRetry(async (id: string) => {
        const [res] = await db
          .insert(hyperdriveConfigs)
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
      const [res] = await db.select().from(hyperdriveConfigs).where(eq(hyperdriveConfigs.id, id))
      return res || null
    },
    listByUser: async (userId: string) => {
      return db.select().from(hyperdriveConfigs).where(eq(hyperdriveConfigs.userId, userId))
    },
    update: async (
      id: string,
      data: Partial<{
        name: string
        cloudflareId: string
        originHost?: string
        originPort?: number
        originScheme?: string
        originDatabase?: string
        originUser?: string
        originPassword?: string
      }>,
    ) => {
      const [res] = await db
        .update(hyperdriveConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(hyperdriveConfigs.id, id))
        .returning()
      return res
    },
    delete: async (id: string) => {
      await db.delete(hyperdriveConfigs).where(eq(hyperdriveConfigs.id, id))
    },
  }
}

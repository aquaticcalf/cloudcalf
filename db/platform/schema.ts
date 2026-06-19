import { relations } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
import { users } from "../auth/schema"

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workerId: text("worker_id"),
    name: text("name").notNull(),
    status: text("status", { enum: ["draft", "deploying", "ready", "failed", "paused"] })
      .notNull()
      .default("draft"),
    productionUrl: text("production_url"),
    lastDeployedAt: integer("last_deployed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userNameUnq: uniqueIndex("projects_user_name_unq").on(table.userId, table.name),
    workerUnq: uniqueIndex("projects_worker_unq").on(table.workerId),
  }),
)

export const deployments = sqliteTable("deployments", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["building", "deploying", "ready", "failed"] }).notNull(),
  source: text("source").notNull().default("cli"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
})

export const projectResources = sqliteTable(
  "project_resources",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    resourceUnq: uniqueIndex("project_resources_unq").on(
      table.projectId,
      table.resourceType,
      table.resourceId,
    ),
  }),
)

export const billingAccounts = sqliteTable("billing_accounts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  polarCustomerId: text("polar_customer_id"),
  tier: text("tier").notNull().default("free"),
  creditBalance: integer("credit_balance").notNull().default(10000),
  currency: text("currency").notNull().default("USD"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const creditTransactions = sqliteTable(
  "credit_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    amount: integer("amount").notNull(),
    kind: text("kind", { enum: ["purchase", "usage", "coupon", "adjustment", "refund"] }).notNull(),
    description: text("description").notNull(),
    externalId: text("external_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    externalUnq: uniqueIndex("credit_transactions_external_unq").on(table.externalId),
  }),
)

export const polarEvents = sqliteTable("polar_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" }).notNull(),
})

export const projectRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  deployments: many(deployments),
  resources: many(projectResources),
}))
export const deploymentRelations = relations(deployments, ({ one }) => ({
  project: one(projects, { fields: [deployments.projectId], references: [projects.id] }),
}))
export const projectResourceRelations = relations(projectResources, ({ one }) => ({
  project: one(projects, { fields: [projectResources.projectId], references: [projects.id] }),
}))

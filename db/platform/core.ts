import { and, desc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"
import { withUniqueRetry } from "../lib"
import {
  billingAccounts,
  creditTransactions,
  deployments,
  polarEvents,
  projectResources,
  projects,
} from "./schema"

export function createPlatform(d1: D1Database) {
  const db = drizzle(d1)
  const getBilling = async (userId: string) => {
    const [account] = await db
      .select()
      .from(billingAccounts)
      .where(eq(billingAccounts.userId, userId))
    if (account) return account
    const [created] = await db
      .insert(billingAccounts)
      .values({ userId, updatedAt: new Date() })
      .returning()
    return created
  }
  return {
    projects: {
      create: (userId: string, name: string, workerId?: string) =>
        withUniqueRetry(async (id) => {
          const now = new Date()
          const [project] = await db
            .insert(projects)
            .values({ id, userId, name, workerId, createdAt: now, updatedAt: now })
            .returning()
          return project
        }),
      async get(id: string) {
        const [project] = await db.select().from(projects).where(eq(projects.id, id))
        return project ?? null
      },
      async getByName(userId: string, name: string) {
        const [project] = await db
          .select()
          .from(projects)
          .where(and(eq(projects.userId, userId), eq(projects.name, name)))
        return project ?? null
      },
      listByUser: (userId: string) =>
        db
          .select()
          .from(projects)
          .where(eq(projects.userId, userId))
          .orderBy(desc(projects.updatedAt)),
      async update(id: string, data: Partial<typeof projects.$inferInsert>) {
        const [project] = await db
          .update(projects)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(projects.id, id))
          .returning()
        return project
      },
    },
    deployments: {
      create: (
        projectId: string,
        status: "building" | "deploying" | "ready" | "failed" = "deploying",
      ) =>
        withUniqueRetry(async (id) => {
          const [deployment] = await db
            .insert(deployments)
            .values({ id, projectId, status, createdAt: new Date() })
            .returning()
          return deployment
        }),
      list: (projectId: string, limit = 10) =>
        db
          .select()
          .from(deployments)
          .where(eq(deployments.projectId, projectId))
          .orderBy(desc(deployments.createdAt))
          .limit(limit),
      async finish(id: string, status: "ready" | "failed", error?: string) {
        const [deployment] = await db
          .update(deployments)
          .set({ status, error, finishedAt: new Date() })
          .where(eq(deployments.id, id))
          .returning()
        return deployment
      },
    },
    resources: {
      async connect(projectId: string, resourceType: string, resourceId: string) {
        const [existing] = await db
          .select()
          .from(projectResources)
          .where(
            and(
              eq(projectResources.projectId, projectId),
              eq(projectResources.resourceType, resourceType),
              eq(projectResources.resourceId, resourceId),
            ),
          )
        if (existing) return existing
        return withUniqueRetry(async (id) => {
          const [link] = await db
            .insert(projectResources)
            .values({ id, projectId, resourceType, resourceId, createdAt: new Date() })
            .returning()
          return link
        })
      },
      list: (projectId: string) =>
        db.select().from(projectResources).where(eq(projectResources.projectId, projectId)),
    },
    billing: {
      get: getBilling,
      transactions: (userId: string, limit = 25) =>
        db
          .select()
          .from(creditTransactions)
          .where(eq(creditTransactions.userId, userId))
          .orderBy(desc(creditTransactions.createdAt))
          .limit(limit),
      async apply(
        userId: string,
        amount: number,
        kind: "purchase" | "usage" | "coupon" | "adjustment" | "refund",
        description: string,
        externalId?: string,
        projectId?: string,
      ) {
        await getBilling(userId)
        return withUniqueRetry(async (id) => {
          await db.batch([
            db.insert(creditTransactions).values({
              id,
              userId,
              projectId,
              amount,
              kind,
              description,
              externalId,
              createdAt: new Date(),
            }),
            db
              .update(billingAccounts)
              .set({
                creditBalance: sql`${billingAccounts.creditBalance} + ${amount}`,
                updatedAt: new Date(),
              })
              .where(eq(billingAccounts.userId, userId)),
          ])
          return getBilling(userId)
        })
      },
      async setPolarCustomer(userId: string, polarCustomerId: string) {
        await getBilling(userId)
        await db
          .update(billingAccounts)
          .set({ polarCustomerId, updatedAt: new Date() })
          .where(eq(billingAccounts.userId, userId))
      },
      async setTier(userId: string, tier: string) {
        await getBilling(userId)
        await db
          .update(billingAccounts)
          .set({ tier, updatedAt: new Date() })
          .where(eq(billingAccounts.userId, userId))
      },
      async markEvent(id: string, type: string) {
        try {
          await db.insert(polarEvents).values({ id, type, processedAt: new Date() })
          return true
        } catch (error) {
          if (String(error).includes("UNIQUE")) return false
          throw error
        }
      },
    },
  }
}

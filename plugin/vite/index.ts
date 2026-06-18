import type { Plugin, ResolvedConfig } from "vite-plus"
import { readdirSync, existsSync, readFileSync } from "fs"
import { join, relative } from "path"

export interface CloudcalfPluginOptions {
  routesDir?: string
}

const VIRTUAL_WORKER = "virtual:cloudcalf-worker"

export function cloudcalfPlugin(options: CloudcalfPluginOptions = {}): Plugin {
  let config: ResolvedConfig
  let routes: { path: string; methods: string[]; file: string }[] = []

  return {
    name: "cloudcalf",

    configResolved(resolved) {
      config = resolved
    },

    buildStart() {
      const root = config.root || process.cwd()
      const routesDir = options.routesDir || join(root, "backend/routes")
      if (!existsSync(routesDir)) {
        config.logger.warn("[cloudcalf] no backend/routes/ found")
        return
      }
      routes = scanRoutes(routesDir, routesDir)
      if (routes.length > 0) {
        config.logger.info(`[cloudcalf] found ${routes.length} route${routes.length !== 1 ? "s" : ""}`)
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_WORKER) return VIRTUAL_WORKER
    },

    load(id) {
      if (id !== VIRTUAL_WORKER) return

      const root = config.root || process.cwd()
      const lines: string[] = []

      lines.push(`import { Hono } from "hono"`)
      lines.push(`import { createRuntime } from "cloudcalf/runtime"`)
      lines.push(``)

      routes.forEach((r, i) => {
        const importPath = relative(root, r.file)
        lines.push(`import * as _r${i} from "/${importPath}"`)
      })

      lines.push(``)
      lines.push(`const app = new Hono()`)
      lines.push(``)

      const methodMap: Record<string, string> = {
        get: "get", post: "post", put: "put", patch: "patch", delete: "delete",
      }

      routes.forEach((r, i) => {
        r.methods.forEach((method) => {
          const honoMethod = methodMap[method]
          if (!honoMethod) return
          lines.push(`app.${honoMethod}("${r.path}", async (c) => {`)
          lines.push(`  const ctx = { ...createRuntime(c.env as any), req: c.req.raw }`)
          lines.push(`  const result = await _r${i}.${method}(ctx)`)
          lines.push(`  return c.json(result)`)
          lines.push(`})`)
          lines.push(``)
        })
      })

      lines.push(`export default { fetch: app.fetch }`)
      return lines.join("\n")
    },
  }
}

function scanRoutes(dir: string, rootDir: string, prefix = ""): { path: string; methods: string[]; file: string }[] {
  const routes: { path: string; methods: string[]; file: string }[] = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      routes.push(...scanRoutes(fullPath, rootDir, `${prefix}/${entry.name}`))
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      const name = entry.name.replace(/\.tsx?$/, "")
      const routePath = name === "index" ? prefix || "" : `${prefix}/${name}`
      const cleanPath = routePath.replace(/\[(\w+)\]/g, ":$1")
      const methods = extractMethods(fullPath)
      if (methods.length > 0) {
        routes.push({ path: `/api${cleanPath}`, methods, file: fullPath })
      }
    }
  }

  return routes
}

function extractMethods(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, "utf8")
    const methods: string[] = []
    const re = /export\s+(?:const|function|async\s+function)\s+(get|post|put|patch|delete)\b/g
    let match: RegExpExecArray | null
    while ((match = re.exec(content)) !== null) {
      methods.push(match[1])
    }
    return [...new Set(methods)]
  } catch {
    return []
  }
}
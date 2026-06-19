import { existsSync, readdirSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"

export type Route = { file: string; path: string; kind: "page" | "endpoint" }

function walk(directory: string, result: string[] = []): string[] {
  if (!existsSync(directory)) return result
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue
    const file = resolve(directory, entry.name)
    if (entry.isDirectory()) walk(file, result)
    else result.push(file)
  }
  return result
}

function pathname(appDirectory: string, file: string): string {
  const segments = relative(appDirectory, dirname(file))
    .split(sep)
    .filter(Boolean)
    .map((segment) => {
      const dynamic = segment.match(/^\[([^.[\]]+)\]$/)
      if (dynamic) return `:${dynamic[1]}`
      if (segment.includes("[") || segment.includes("]"))
        throw new Error(`Invalid route segment “${segment}”`)
      return segment
    })
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/"
}

export function discoverRoutes(root: string): Route[] {
  const appDirectory = resolve(root, "app")
  const routes = walk(appDirectory)
    .flatMap((file): Route[] => {
      if (/page\.(tsx|jsx)$/.test(file))
        return [{ file, path: pathname(appDirectory, file), kind: "page" }]
      if (/route\.(ts|js)$/.test(file))
        return [{ file, path: pathname(appDirectory, file), kind: "endpoint" }]
      return []
    })
    .sort((a, b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind))

  for (const kind of ["page", "endpoint"] as const) {
    const seen = new Map<string, string>()
    for (const route of routes.filter((candidate) => candidate.kind === kind)) {
      const key = route.path.replace(/:[^/]+/g, ":param")
      const previous = seen.get(key)
      if (previous)
        throw new Error(
          `Conflicting routes: ${relative(root, previous)} and ${relative(root, route.file)}`,
        )
      seen.set(key, route.file)
    }
  }
  return routes
}

export const toImportPath = (file: string) => file.split(sep).join("/")

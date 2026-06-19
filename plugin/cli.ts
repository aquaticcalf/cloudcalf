#!/usr/bin/env node
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { basename, dirname, resolve } from "node:path"
import { cac } from "cac"
import react from "@vitejs/plugin-react"
import { build as viteBuild, createServer, loadConfigFromFile } from "vite-plus"
import type { UserConfig } from "vite-plus"
import cloudcalf from "./index.ts"
import { buildWorker } from "./worker.ts"
import { login, removeCredential, sessionToken, verifySession } from "./auth.ts"

type CloudConfig = { root?: string; backendPort?: number; vite?: UserConfig }

const cli = cac("cloudcalf")
const CLOUDCALF_PLATFORM_URL = "https://cloud.calf.lol"
const configNames = ["cloud.config.ts", "cloud.config.js", "cloud.config.mjs"]
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))
const platformOrigin = () => process.env.CLOUDCALF_API_URL || CLOUDCALF_PLATFORM_URL

async function loadCloudConfig(command: "serve" | "build") {
  const cwd = process.cwd()
  const file = configNames.map((name) => resolve(cwd, name)).find(existsSync)
  if (!file) throw new Error(`No cloud.config.ts found in ${cwd}`)
  const loaded = await loadConfigFromFile(
    { command, mode: command === "serve" ? "development" : "production" },
    file,
  )
  if (!loaded) throw new Error(`Could not load ${file}`)
  const cloud = loaded.config as CloudConfig
  const root = resolve(dirname(file), cloud.root || ".")
  const vite = cloud.vite || {}
  return {
    root,
    vite: {
      ...vite,
      root,
      configFile: false as const,
      plugins: [react(), cloudcalf({ backendPort: cloud.backendPort }), ...(vite.plugins || [])],
    },
  }
}

async function buildApplication() {
  const project = await loadCloudConfig("build")
  await viteBuild(project.vite)
  const outDir = typeof project.vite.build?.outDir === "string" ? project.vite.build.outDir : "dist"
  const artifact = await buildWorker(project.root, {
    includeAssets: true,
    assetsDirectory: resolve(project.root, outDir),
  })
  return { ...project, artifact }
}

async function projectName(root: string) {
  try {
    const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))
    return String(pkg.name || basename(root))
      .replace(/^@[^/]+\//, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "")
  } catch {
    return basename(root)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const origin = platformOrigin()
  const session = await sessionToken(origin)
  const headers = new Headers(init.headers)
  headers.set("user-agent", "cloudcalf-cli/0.0.1")
  if (session) headers.set("cookie", `session=${session}`)
  const response = await fetch(`${origin}${path}`, { ...init, headers })
  const body = (await response.json().catch(() => null)) as any
  if (!response.ok) throw new Error(body?.error || `${response.status} ${response.statusText}`)
  return body as T
}

cli.command("dev", "Start the Cloudcalf development server").action(async () => {
  try {
    const project = await loadCloudConfig("serve")
    const server = await createServer(project.vite)
    await server.listen()
    server.printUrls()
  } catch (error) {
    console.error(`cloudcalf dev: ${errorMessage(error)}`)
    process.exitCode = 1
  }
})

cli.command("build", "Create a production Cloudflare worker").action(async () => {
  try {
    const { artifact } = await buildApplication()
    console.log(`cloudcalf: built ${artifact.bundle}`)
  } catch (error) {
    console.error(`cloudcalf build: ${errorMessage(error)}`)
    process.exitCode = 1
  }
})

cli
  .command("login [provider]", "Authenticate with the Cloudcalf platform")
  .option("--no-browser", "Print the authentication URL instead of opening it")
  .action(async (provider = "github", options: { browser?: boolean }) => {
    try {
      if (provider !== "github" && provider !== "google")
        throw new Error("Provider must be github or google")
      const auth = await login(platformOrigin(), provider, options.browser !== false)
      console.log(`Logged in to ${platformOrigin()} as ${auth.user.name} (${auth.user.email})`)
    } catch (error) {
      console.error(`cloudcalf login: ${errorMessage(error)}`)
      process.exitCode = 1
    }
  })

cli
  .command("auth [action]", "Manage Cloudcalf authentication")
  .action(async (action = "status") => {
    try {
      if (action !== "status") throw new Error("Supported action: status")
      const origin = platformOrigin()
      const token = await sessionToken(origin)
      if (!token) throw new Error("Not logged in. Run `cloudcalf login`.")
      const auth = await verifySession(origin, token)
      console.log(
        `${origin}\n  Logged in as ${auth.user.name} (${auth.user.email}) via ${auth.user.provider}\n  Session expires ${new Date(auth.expiresAt).toLocaleString()}`,
      )
    } catch (error) {
      console.error(`cloudcalf auth status: ${errorMessage(error)}`)
      process.exitCode = 1
    }
  })

cli.command("logout", "Log out of the Cloudcalf platform").action(async () => {
  const origin = platformOrigin()
  try {
    const token = await sessionToken(origin)
    if (token)
      await fetch(`${origin}/api/auth/logout`, {
        method: "POST",
        headers: { cookie: `session=${token}`, "user-agent": "cloudcalf-cli/0.0.1" },
      })
    await removeCredential(origin)
    console.log(`Logged out of ${origin}`)
  } catch (error) {
    console.error(`cloudcalf logout: ${errorMessage(error)}`)
    process.exitCode = 1
  }
})

cli.command("deploy", "Build and deploy this application to Cloudcalf").action(async () => {
  try {
    if (!(await sessionToken(platformOrigin())))
      throw new Error("Not logged in. Run `cloudcalf login` before deploying.")
    const { root, artifact } = await buildApplication()
    const name = await projectName(root)
    const workers = await api<Array<{ id: string; name: string }>>("/api/cf/worker")
    let worker = workers.find((candidate) => candidate.name === name)
    if (!worker)
      worker = await api<{ id: string; name: string }>("/api/cf/worker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      })
    const source = await readFile(artifact.bundle)
    const upload = new FormData()
    upload.set(
      "metadata",
      new Blob(
        [
          JSON.stringify({
            main_module: "worker.js",
            compatibility_date: "2025-09-01",
            compatibility_flags: ["nodejs_compat"],
          }),
        ],
        { type: "application/json" },
      ),
    )
    upload.set(
      "worker.js",
      new Blob([source], { type: "application/javascript+module" }),
      "worker.js",
    )
    await api(`/api/cf/worker/${worker.id}/upload`, { method: "PUT", body: upload })
    console.log(`cloudcalf: deployed ${name}`)
  } catch (error) {
    console.error(`cloudcalf deploy: ${errorMessage(error)}`)
    process.exitCode = 1
  }
})

cli.help()
cli.version("0.0.1")
cli.parse()

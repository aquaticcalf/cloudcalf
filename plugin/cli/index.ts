#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { spawnSync, execSync } from "child_process"

const [cmd, ...rest] = process.argv.slice(2)

if (!cmd || cmd === "--help") {
  console.log(`
cloud <command>

commands:
  dev        start development server
  build      build for production
  deploy     deploy worker
  init       scaffold a new project
  login      authenticate with cloudcalf
  --help     show this message
`)
  process.exit(0)
}

const cwd = process.cwd()

function checkConfig() {
  const path = join(cwd, "cloud.config.ts")
  if (!existsSync(path)) {
    console.error("cloud.config.ts not found — run 'cloud init' first")
    process.exit(1)
  }
}

function ensureViteConfig() {
  const vitePath = join(cwd, "vite.config.ts")
  if (existsSync(vitePath)) return

  const configPath = join(cwd, "cloud.config.ts")
  if (!existsSync(configPath)) return

  writeFileSync(vitePath, [
    `import { defineConfig } from "vite-plus"`,
    `import { cloudflare } from "@cloudflare/vite-plugin"`,
    `import { cloudcalfPlugin } from "cloudcalf/vite"`,
    `import cloud from "./cloud.config"`,
    ``,
    `export default defineConfig({`,
    `  plugins: [`,
    `    ...(cloud.frontend?.plugins ?? []),`,
    `    cloudflare(),`,
    `    cloudcalfPlugin(),`,
    `  ],`,
    `})`,
    ``,
  ].join("\n"))
}

switch (cmd) {
  case "dev":
    checkConfig()
    ensureViteConfig()
    spawnSync("vp", ["dev"], { stdio: "inherit", cwd })
    break

  case "build":
    checkConfig()
    ensureViteConfig()
    spawnSync("vp", ["build"], { stdio: "inherit", cwd })
    break

  case "init":
    initProject(rest[0] || "my-app")
    break

  case "deploy":
    deploy()
    break

  case "login":
    login()
    break

  default:
    console.error("unknown command:", cmd)
    process.exit(1)
}

function initProject(name: string) {
  const dir = join(cwd, name)
  const dirs = [`${dir}/frontend/src`, `${dir}/backend/routes/webhooks`, `${dir}/public`]
  dirs.forEach((d) => mkdirSync(d, { recursive: true }))

  writeFileSync(join(dir, "cloud.config.ts"), [
    `import { defineConfig } from "cloudcalf"`,
    `import react from "@vitejs/plugin-react"`,
    ``,
    `export default defineConfig({`,
    `  name: "${name}",`,
    `  frontend: { plugins: [react()] },`,
    `})`,
  ].join("\n") + "\n")

  writeFileSync(join(dir, "package.json"), JSON.stringify({
    name, type: "module", private: true,
    scripts: { dev: "cloud dev", build: "cloud build", deploy: "cloud deploy" },
    dependencies: { cloudcalf: "latest", react: "^19", "react-dom": "^19" },
    devDependencies: { "@vitejs/plugin-react": "^6", "@cloudflare/vite-plugin": "^1" },
  }, null, 2) + "\n")

  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "es2022", module: "esnext", moduleResolution: "bundler",
      jsx: "react-jsx", strict: true,
      types: ["@cloudflare/workers-types"],
    },
    include: ["**/*.ts", "**/*.tsx"],
  }, null, 2) + "\n")

  writeFileSync(join(dir, "frontend/index.html"), [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head><meta charset="utf-8"><title>${name}</title></head>`,
    `<body><div id="root"></div>`,
    `<script type="module" src="/src/index.tsx"></script></body>`,
    `</html>`,
  ].join("\n") + "\n")

  writeFileSync(join(dir, "frontend/src/index.tsx"), [
    `import { createRoot } from "react-dom/client"`,
    `import App from "./app"`,
    `createRoot(document.getElementById("root")!).render(<App />)`,
  ].join("\n") + "\n")

  writeFileSync(join(dir, "frontend/src/app.tsx"), [
    `export default function App() {`,
    `  return <h1>hello from ${name}</h1>`,
    `}`,
  ].join("\n") + "\n")

  writeFileSync(join(dir, "backend/routes/hello.ts"), [
    `import { route } from "cloudcalf/runtime"`,
    ``,
    `export const get = route(async () => {`,
    `  return { message: "hello from cloudcalf!" }`,
    `})`,
  ].join("\n") + "\n")

  writeFileSync(join(dir, "frontend/vite.config.ts"), [
    `import { defineConfig } from "vite"`,
    `import react from "@vitejs/plugin-react"`,
    `export default defineConfig({ plugins: [react()] })`,
  ].join("\n") + "\n")

  console.log(`project "${name}" created at ${dir}`)
  console.log("next steps:")
  console.log(`  cd ${name}`)
  console.log("  npm install")
  console.log("  cloud dev")
}

function deploy() {
  checkConfig()
  const buildDir = join(cwd, "dist")
  if (!existsSync(buildDir)) {
    console.error("nothing to deploy — run 'cloud build' first")
    process.exit(1)
  }
  const tokenPath = join(cwd, ".cloudcalf-token")
  if (!existsSync(tokenPath)) {
    console.error("not logged in — run 'cloud login' first")
    process.exit(1)
  }
  const token = readFileSync(tokenPath, "utf8").trim()
  const workerSrc = readFileSync(join(buildDir, "cloud-worker"), "utf8")
  const result = execSync(
    `curl -s -X PUT -H 'Authorization: Bearer ${token}' -H 'Content-Type: application/javascript' --data-binary @- https://cloudcalf.dev/api/cf/worker/id/upload`,
    { input: workerSrc, cwd },
  )
  console.log(result.toString())
}

function login() {
  console.log("opening browser for authentication...")
  execSync("open https://cloudcalf.dev/api/auth/github/login", { stdio: "inherit" })
  console.log("after login, save the session token to .cloudcalf-token")
}
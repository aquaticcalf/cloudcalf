import { createServer } from "node:http"
import { randomBytes } from "node:crypto"
import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { spawn } from "node:child_process"

export interface AuthUser {
  id: string
  name: string
  email: string
  provider: string
  avatarUrl?: string | null
}
export interface AuthSession {
  user: AuthUser
  expiresAt: string
}
type StoredCredential = { session: string; user: AuthUser; expiresAt: string }
type CredentialStore = { version: 1; hosts: Record<string, StoredCredential> }

const normalizeOrigin = (origin: string) => new URL(origin).origin

export function credentialsFile() {
  const root =
    process.env.CLOUDCALF_CONFIG_DIR ||
    (process.platform === "win32"
      ? join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "cloudcalf")
      : join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "cloudcalf"))
  return join(root, "credentials.json")
}

async function readStore(): Promise<CredentialStore> {
  try {
    const parsed = JSON.parse(await readFile(credentialsFile(), "utf8"))
    if (parsed?.version === 1 && parsed.hosts && typeof parsed.hosts === "object") return parsed
  } catch (error: any) {
    if (error?.code !== "ENOENT")
      throw new Error(`Could not read Cloudcalf credentials: ${error.message}`)
  }
  return { version: 1, hosts: {} }
}

async function writeStore(store: CredentialStore) {
  const file = credentialsFile()
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  await chmod(dirname(file), 0o700).catch(() => undefined)
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 })
  await rename(temporary, file)
  await chmod(file, 0o600).catch(() => undefined)
}

export async function sessionToken(origin: string) {
  if (process.env.CLOUDCALF_SESSION) return process.env.CLOUDCALF_SESSION
  return (await readStore()).hosts[normalizeOrigin(origin)]?.session
}

async function saveCredential(origin: string, session: string, auth: AuthSession) {
  const store = await readStore()
  store.hosts[normalizeOrigin(origin)] = { session, user: auth.user, expiresAt: auth.expiresAt }
  await writeStore(store)
}

export async function removeCredential(origin: string) {
  const store = await readStore()
  delete store.hosts[normalizeOrigin(origin)]
  if (Object.keys(store.hosts).length === 0) await rm(credentialsFile(), { force: true })
  else await writeStore(store)
}

async function openBrowser(url: string) {
  const command =
    process.platform === "darwin"
      ? { file: "open", args: [url] }
      : process.platform === "win32"
        ? { file: "cmd", args: ["/d", "/s", "/c", "start", "", url] }
        : { file: "xdg-open", args: [url] }
  return new Promise<boolean>((resolve) => {
    const child = spawn(command.file, command.args, { detached: true, stdio: "ignore" })
    child.once("error", () => resolve(false))
    child.once("spawn", () => {
      child.unref()
      resolve(true)
    })
  })
}

function waitForCallback() {
  const nonce = randomBytes(32).toString("base64url")
  const callbackPath = `/callback/${randomBytes(18).toString("base64url")}`
  let settled = false
  let timer: ReturnType<typeof setTimeout>
  let resolveSession!: (session: string) => void
  let rejectSession!: (error: Error) => void
  const result = new Promise<string>((resolve, reject) => {
    resolveSession = resolve
    rejectSession = reject
  })
  const server = createServer((request, response) => {
    if (
      request.method !== "POST" ||
      request.url !== callbackPath ||
      !request.socket.remoteAddress?.includes("127.0.0.1")
    ) {
      response.writeHead(404).end("Not found")
      return
    }
    let body = ""
    request.setEncoding("utf8")
    request.on("data", (chunk) => {
      body += chunk
      if (body.length > 16_384) request.destroy()
    })
    request.on("end", () => {
      const fields = new URLSearchParams(body)
      const receivedNonce = fields.get("nonce")
      const session = fields.get("session")
      if (receivedNonce !== nonce || !session) {
        response
          .writeHead(400, { "content-type": "text/plain" })
          .end("Invalid Cloudcalf login response")
        return
      }
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      })
      response.end(
        "<!doctype html><title>Cloudcalf login complete</title><p style='font:18px system-ui;margin:20vh auto;max-width:560px'>You are logged in to Cloudcalf. You can close this tab.</p>",
      )
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolveSession(session)
        server.close()
      }
    })
  })
  const ready = new Promise<{ callback: string; nonce: string }>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string")
        return reject(new Error("Could not start login callback server"))
      resolve({ callback: `http://127.0.0.1:${address.port}${callbackPath}`, nonce })
    })
  })
  timer = setTimeout(
    () => {
      if (!settled) {
        settled = true
        server.close()
        rejectSession(new Error("Login timed out after 5 minutes"))
      }
    },
    5 * 60 * 1000,
  )
  timer.unref()
  return {
    ready,
    result,
    close: () => {
      clearTimeout(timer)
      server.close()
    },
  }
}

export async function verifySession(origin: string, token: string): Promise<AuthSession> {
  const response = await fetch(`${normalizeOrigin(origin)}/api/auth/session`, {
    headers: { cookie: `session=${token}` },
  })
  const body = (await response.json().catch(() => null)) as any
  if (!response.ok) throw new Error(body?.error || "The platform rejected this session")
  return body as AuthSession
}

export async function login(origin: string, provider: "github" | "google", launchBrowser = true) {
  const loopback = waitForCallback()
  const { callback, nonce } = await loopback.ready
  const url = new URL(`/api/auth/${provider}/login`, normalizeOrigin(origin))
  url.searchParams.set("cli_callback", callback)
  url.searchParams.set("cli_nonce", nonce)
  if (launchBrowser && (await openBrowser(url.href)))
    console.log("Opening Cloudcalf in your browser…")
  else console.log(`Open this URL to authenticate:\n\n${url.href}\n`)
  try {
    const token = await loopback.result
    const auth = await verifySession(origin, token)
    await saveCredential(origin, token, auth)
    return auth
  } finally {
    loopback.close()
  }
}

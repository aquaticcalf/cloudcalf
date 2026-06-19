import { createOAuthHandler, github, google } from "oauth"
import { createDb } from "db"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

const transientCookie = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
  path: "/api/auth",
  maxAge: 600,
}

function validLoopbackCallback(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === "http:" &&
      ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) &&
      Boolean(url.port) &&
      url.username === "" &&
      url.password === ""
    )
  } catch {
    return false
  }
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  )

function cliSuccessPage(callback: string, nonce: string, token: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Cloudcalf CLI authenticated</title></head>
<body style="font:16px system-ui;max-width:560px;margin:18vh auto;padding:24px;color:#18181b">
<form id="handoff" method="post" action="${escapeHtml(callback)}">
<input type="hidden" name="nonce" value="${escapeHtml(nonce)}">
<input type="hidden" name="session" value="${escapeHtml(token)}">
<h1>Authentication complete</h1><p>Returning securely to the Cloudcalf CLI. You can close this tab afterward.</p>
<button type="submit">Return to CLI</button></form><script>document.getElementById("handoff").submit()</script>
</body></html>`
}

export function createAuthRoutes() {
  const app = createOAuthHandler<{ Bindings: Env }>({
    providers: (c) => [
      github({
        clientId: c.env.GITHUB_CLIENT_ID,
        clientSecret: c.env.GITHUB_CLIENT_SECRET,
        redirectUri: new URL(c.req.url).origin + "/api/auth/github/callback",
      }),
      google({
        clientId: c.env.GOOGLE_CLIENT_ID,
        clientSecret: c.env.GOOGLE_CLIENT_SECRET,
        redirectUri: new URL(c.req.url).origin + "/api/auth/google/callback",
      }),
    ],
    onLogin(c) {
      const callback = c.req.query("cli_callback")
      const nonce = c.req.query("cli_nonce")
      if (!callback && !nonce) return
      if (!callback || !validLoopbackCallback(callback)) return c.text("invalid cli callback", 400)
      if (!nonce || !/^[A-Za-z0-9_-]{32,128}$/.test(nonce)) return c.text("invalid cli nonce", 400)
      setCookie(c, "cli_callback", callback, transientCookie)
      setCookie(c, "cli_nonce", nonce, transientCookie)
    },
    async onSuccess(user, c) {
      const db = createDb(c.env.DB)
      const session = await db.auth.authenticate({
        provider: user.provider,
        providerId: user.providerId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? undefined,
      })
      const callback = getCookie(c, "cli_callback")
      const nonce = getCookie(c, "cli_nonce")
      const headers = new Headers()
      headers.append(
        "Set-Cookie",
        `session=${session.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
      )
      headers.append(
        "Set-Cookie",
        "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      )
      headers.append(
        "Set-Cookie",
        "code_verifier=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      )
      headers.append(
        "Set-Cookie",
        "cli_callback=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0",
      )
      headers.append(
        "Set-Cookie",
        "cli_nonce=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0",
      )
      if (callback && nonce && validLoopbackCallback(callback)) {
        headers.set("Content-Type", "text/html; charset=utf-8")
        headers.set("Cache-Control", "no-store")
        return new Response(cliSuccessPage(callback, nonce, session.token), { headers })
      }
      headers.set("Location", "/")
      return new Response(null, { status: 302, headers })
    },
    onError(error, c) {
      console.error("oauth error : ", error)
      return c.text(`oauth authentication failed : ${error.message}`, 401)
    },
  })

  app.get("/session", async (c) => {
    const token = getCookie(c, "session")
    if (!token) return c.json({ error: "Unauthorized" }, 401)
    const db = createDb(c.env.DB)
    const session = await db.auth.getSession(token)
    if (!session) return c.json({ error: "Unauthorized" }, 401)
    const user = await db.auth.getUser(session.userId)
    if (!user) return c.json({ error: "Unauthorized" }, 401)
    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatarUrl: user.avatarUrl,
      },
      expiresAt: session.expiresAt,
    })
  })

  app.post("/logout", async (c) => {
    const token = getCookie(c, "session")
    if (token) await createDb(c.env.DB).auth.signOut(token)
    deleteCookie(c, "session", { path: "/", secure: true, sameSite: "Lax" })
    return c.body(null, 204)
  })

  return app
}

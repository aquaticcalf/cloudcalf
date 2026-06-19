import { StrictMode, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  Activity,
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Code2,
  Coins,
  Database,
  ExternalLink,
  HardDrive,
  Layers3,
  LogOut,
  Menu,
  PackageOpen,
  RefreshCw,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react"
import "./index.css"

type User = {
  id: string
  name: string
  email: string
  provider: string
  avatarUrl?: string | null
}
type Session = { user: User; expiresAt: string }
type Resource = {
  id: string
  type: string
  name: string
  connected: boolean
  updatedAt?: string
}
type Deployment = {
  id: string
  status: string
  createdAt: string
  finishedAt?: string | null
  error?: string | null
}
type Project = {
  id: string
  name: string
  status: string
  productionUrl?: string | null
  lastDeployedAt?: string | null
  resourceCount: number
  resources: Resource[]
  latestDeployment?: Deployment | null
  deployments?: Deployment[]
}
type Billing = {
  account: {
    creditBalance: number
    tier: string
    currency: string
    polarCustomerId?: string | null
  }
  transactions: Array<{
    id: string
    amount: number
    kind: string
    description: string
    createdAt: string
  }>
  tiers: Array<{
    id: string
    name: string
    credits: number
    available: boolean
  }>
  polarConfigured: boolean
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const body: any = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || "Something went wrong")
  return body as T
}

function navigate(path: string) {
  history.pushState(null, "", path)
  dispatchEvent(new PopStateEvent("popstate"))
  scrollTo({ top: 0, behavior: "smooth" })
}

function GithubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.28-1.29-5.28-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18A11 11 0 0 1 12 6.12c.98 0 1.94.13 2.85.38 2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.72 5.38-5.3 5.67.42.36.79 1.06.79 2.14v3.28c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}

function Link({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (!event.metaKey && !event.ctrlKey) {
          event.preventDefault()
          navigate(href)
        }
      }}
    >
      {children}
    </a>
  )
}

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not deployed"
const formatCredits = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)
const resourceLabels: Record<string, string> = {
  kv: "KV",
  d1: "D1",
  r2: "R2",
  queue: "Queues",
  vectorize: "Vectorize",
  ai: "Workers AI",
  analytics: "Analytics",
  hyperdrive: "Hyperdrive",
  email: "Email",
  fetcher: "Service",
  dispatch: "Dispatch",
  durableobject: "Durable Object",
  ratelimit: "Rate Limit",
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className={`brand ${inverse ? "brand-inverse" : ""}`}>
      <span className="brand-mark">
        <Cloud size={18} strokeWidth={2.4} />
      </span>
      <span>cloudcalf</span>
    </Link>
  )
}

function Home({ session }: { session: Session | null }) {
  return (
    <main className="marketing">
      <nav className="marketing-nav">
        <Brand />
        <div className="nav-links">
          <a href="#primitives">Primitives</a>
          <a href="#workflow">How it works</a>
          <Link
            href={session ? "/dashboard" : "/login"}
            className="button button-small button-dark"
          >
            {session ? "Open dashboard" : "Start building"}
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> The Cloudflare stack, made effortless
          </div>
          <h1>
            Ship the app.
            <br />
            <span>Skip the cloud work.</span>
          </h1>
          <p>
            cloudcalf turns your React app into a production Cloudflare application - with routing,
            databases, storage, AI, queues, and deployments already connected.
          </p>
          <div className="hero-actions">
            <Link href={session ? "/dashboard" : "/signup"} className="button button-primary">
              Deploy your first app <ArrowRight size={17} />
            </Link>
            <a href="https://github.com" className="button button-ghost">
              <GithubMark size={17} /> View on GitHub
            </a>
          </div>
          <div className="install">
            <span>$</span>
            <code>pnpm add cloudcalf</code>
            <span className="install-note">then run cloudcalf deploy</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="cloudcalf deployment preview">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="terminal-card">
            <div className="terminal-top">
              <span />
              <span />
              <span />
              <em>cloudcalf deploy</em>
            </div>
            <div className="terminal-body">
              <p>
                <i>→</i> discovering your application
              </p>
              <p>
                <i>✓</i> 4 pages and 3 routes
              </p>
              <p>
                <i>✓</i> connected D1, KV and R2
              </p>
              <p>
                <i>✓</i> deployed to Cloudflare edge
              </p>
              <div className="terminal-success">
                <Zap size={16} fill="currentColor" /> calf-notes is live
              </div>
            </div>
          </div>
          <div className="resource-float float-a">
            <Database size={18} />
            <span>D1 database</span>
            <Check size={14} />
          </div>
          <div className="resource-float float-b">
            <HardDrive size={18} />
            <span>R2 files</span>
            <Check size={14} />
          </div>
        </div>
      </section>
      <section className="trust-strip">
        <span>One framework. Every primitive.</span>
        <div>
          <b>Workers</b>
          <b>D1</b>
          <b>R2</b>
          <b>KV</b>
          <b>Queues</b>
          <b>Vectorize</b>
          <b>AI</b>
        </div>
      </section>
      <section className="features" id="primitives">
        <div className="section-heading">
          <span>Cloud primitives</span>
          <h2>Infrastructure that reads like product code.</h2>
          <p>
            Import what you need. cloudcalf discovers, provisions, connects, and meters it for you.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-wide">
            <div>
              <span className="feature-icon">
                <Database />
              </span>
              <h3>Data without configuration</h3>
              <p>
                Use SQL, key-value storage, and object storage directly. Local development is
                automatic; production bindings appear at deploy time.
              </p>
            </div>
            <pre>
              <span>import</span> {`{ database, storage }`} <span>from</span> "cloudcalf"{`\n\n`}
              <b>await</b> database.query(<i>"select * from notes"</i>){`\n`}
              <b>await</b> storage.set(<i>"theme"</i>, <i>"night"</i>)
            </pre>
          </article>
          <article className="feature-card">
            <span className="feature-icon">
              <Layers3 />
            </span>
            <h3>Full-stack routing</h3>
            <p>Pages and typed API routes live together in your app directory.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">
              <Activity />
            </span>
            <h3>Usage you can understand</h3>
            <p>See every project, primitive, deployment, and credit from one dashboard.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">
              <Code2 />
            </span>
            <h3>Cloudflare-native</h3>
            <p>Workers performance and primitives without Wrangler or account configuration.</p>
          </article>
        </div>
      </section>
      <section className="cta" id="workflow">
        <img src="/favicon.svg" alt="cloudcalf" />
        <div>
          <span>Ready when you are</span>
          <h2>From localhost to the edge in one command.</h2>
        </div>
        <Link href={session ? "/dashboard" : "/signup"} className="button button-light">
          Start building <ArrowRight size={17} />
        </Link>
      </section>
      <footer>
        <Brand />
        <span>Built on Cloudflare. Designed for builders.</span>
        <span>© {new Date().getFullYear()} cloudcalf</span>
      </footer>
    </main>
  )
}

function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup"
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Brand inverse />
        <div>
          <span className="eyebrow dark">
            <Zap size={14} /> Zero-config Cloudflare
          </span>
          <h1>
            Your whole stack,
            <br />
            one command away.
          </h1>
          <p>
            Build with the primitives you already know. cloudcalf handles everything between your
            code and the edge.
          </p>
        </div>
        <div className="auth-code">
          <div>
            <i />
            <i />
            <i />
          </div>
          <code>
            <span>$</span> cloudcalf deploy
            <br />
            <b>✓</b> application live in 2.4s
          </code>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="auth-kicker">{signup ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</span>
          <h2>{signup ? "Start building on the edge" : "Sign in to cloudcalf"}</h2>
          <p>
            {signup
              ? "Free to start. Add credits when you are ready to ship."
              : "Continue to your projects and deployments."}
          </p>
          <div className="provider-list">
            <a className="provider-button" href="/api/auth/github/login">
              <GithubMark size={20} /> Continue with GitHub <ChevronRight size={17} />
            </a>
            <a className="provider-button" href="/api/auth/google/login">
              <span className="google-mark">G</span> Continue with Google <ChevronRight size={17} />
            </a>
          </div>
          <div className="auth-divider">
            <span>secure OAuth authentication</span>
          </div>
          <p className="auth-switch">
            {signup ? "Already have an account?" : "New to cloudcalf?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <small>By continuing, you agree to the Terms and Privacy Policy.</small>
        </div>
      </section>
    </main>
  )
}

function DashboardShell({
  session,
  children,
  active,
}: {
  session: Session
  children: React.ReactNode
  active: string
}) {
  const [open, setOpen] = useState(false)
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    location.href = "/"
  }
  return (
    <div className="dashboard">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-head">
          <Brand inverse />
          <button className="icon-button mobile-only" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          <span>WORKSPACE</span>
          <Link href="/dashboard" className={active === "projects" ? "active" : ""}>
            <Layers3 /> Projects
          </Link>
          <Link href="/dashboard/billing" className={active === "billing" ? "active" : ""}>
            <CircleDollarSign /> Billing & credits
          </Link>
          <span>DEVELOPER</span>
          <a href="/docs">
            <Code2 /> Documentation
          </a>
          <a href="https://github.com">
            <GithubMark /> GitHub
          </a>
        </nav>
        <div className="sidebar-account">
          <img src={session.user.avatarUrl || "/favicon.svg"} />
          <div>
            <b>{session.user.name}</b>
            <span>{session.user.email}</span>
          </div>
          <button onClick={logout} title="Log out">
            <LogOut />
          </button>
        </div>
      </aside>
      <div className="dash-main">
        <header className="dash-top">
          <button className="icon-button mobile-only" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="top-status">
            <span className="pulse" /> All systems operational
          </div>
          <div className="top-user">
            {session.user.avatarUrl && <img src={session.user.avatarUrl} />}
            <span>{session.user.name}</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      <i />
      {value === "ready" ? "Live" : value}
    </span>
  )
}

function ProjectsPage({ session }: { session: Session }) {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState("")
  const load = () => {
    setError("")
    api<Project[]>("/api/projects")
      .then(setProjects)
      .catch((e) => setError(e.message))
  }
  useEffect(() => {
    load()
  }, [])
  return (
    <DashboardShell session={session} active="projects">
      <div className="dash-content">
        <div className="page-title">
          <div>
            <span>OVERVIEW</span>
            <h1>Your projects</h1>
            <p>Everything you have running on the Cloudflare edge.</p>
          </div>
          <div className="title-actions">
            <button className="button button-ghost button-small" onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="button button-primary button-small"
              onClick={() => navigator.clipboard.writeText("cloudcalf deploy")}
            >
              <Zap size={15} /> New project
            </button>
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {projects === null ? (
          <Loading />
        ) : projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <>
            <div className="metric-grid">
              <Metric
                label="Projects"
                value={String(projects.length)}
                detail={`${projects.filter((p) => p.status === "ready").length} live`}
                icon={<Layers3 />}
              />
              <Metric
                label="Connected resources"
                value={String(projects.reduce((sum, p) => sum + p.resourceCount, 0))}
                detail="Across all projects"
                icon={<Database />}
              />
              <Metric
                label="Latest deploy"
                value={formatDate(projects[0]?.lastDeployedAt)}
                detail={projects[0]?.name || "No deployments"}
                icon={<Activity />}
              />
            </div>
            <div className="project-section">
              <div className="table-heading">
                <h2>All projects</h2>
                <span>{projects.length} total</span>
              </div>
              <div className="project-table">
                <div className="project-row project-header">
                  <span>Project</span>
                  <span>Status</span>
                  <span>Resources</span>
                  <span>Last deployed</span>
                  <span />
                </div>
                {projects.map((project) => (
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="project-row"
                    key={project.id}
                  >
                    <div className="project-name">
                      <span className="project-avatar">
                        {project.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <b>{project.name}</b>
                        <small>
                          {project.productionUrl?.replace("https://", "") ||
                            "Awaiting first deployment"}
                        </small>
                      </div>
                    </div>
                    <Status value={project.status} />
                    <div className="resource-stack">
                      {project.resources.slice(0, 4).map((r) => (
                        <span key={r.id} title={resourceLabels[r.type] || r.type}>
                          {resourceLabels[r.type]?.slice(0, 2) || r.type.slice(0, 2)}
                        </span>
                      ))}
                      {project.resourceCount === 0 && <small>No resources</small>}
                      {project.resourceCount > 4 && <small>+{project.resourceCount - 4}</small>}
                    </div>
                    <span className="date-cell">{formatDate(project.lastDeployedAt)}</span>
                    <ChevronRight className="row-arrow" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}

function ProjectPage({ session, id }: { session: Session; id: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    api<Project>(`/api/projects/${id}`)
      .then(setProject)
      .catch((e) => setError(e.message))
  }, [id])
  return (
    <DashboardShell session={session} active="projects">
      <div className="dash-content">
        {error ? (
          <div className="error-banner">{error}</div>
        ) : !project ? (
          <Loading />
        ) : (
          <>
            <div className="project-hero">
              <div>
                <Link href="/dashboard" className="back-link">
                  ← Projects
                </Link>
                <div className="project-title-line">
                  <span className="project-avatar large">
                    {project.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div>
                      <h1>{project.name}</h1>
                      <Status value={project.status} />
                    </div>
                    <p>
                      {project.productionUrl || "Deploy from the CLI to create a production URL"}
                    </p>
                  </div>
                </div>
              </div>
              {project.productionUrl && (
                <a
                  href={project.productionUrl}
                  target="_blank"
                  className="button button-dark button-small"
                >
                  Visit app <ExternalLink size={15} />
                </a>
              )}
            </div>
            <div className="detail-grid">
              <section className="panel resources-panel">
                <div className="panel-head">
                  <div>
                    <span>INFRASTRUCTURE</span>
                    <h2>Connected resources</h2>
                  </div>
                  <b>{project.resources.length}</b>
                </div>
                {project.resources.length ? (
                  <div className="resource-list">
                    {project.resources.map((resource) => (
                      <div className="resource-item" key={resource.id}>
                        <span className={`resource-icon resource-${resource.type}`}>
                          {resource.type === "d1" ? (
                            <Database />
                          ) : resource.type === "r2" ? (
                            <HardDrive />
                          ) : resource.type === "ai" ? (
                            <Sparkles />
                          ) : (
                            <Box />
                          )}
                        </span>
                        <div>
                          <b>{resourceLabels[resource.type] || resource.type}</b>
                          <small>{resource.name}</small>
                        </div>
                        <span className={resource.connected ? "connected" : "pending"}>
                          {resource.connected ? "Connected" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-small">
                    <PackageOpen />
                    <b>No primitives connected yet</b>
                    <p>Import a cloudcalf primitive and deploy again.</p>
                  </div>
                )}
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <span>ACTIVITY</span>
                    <h2>Deployments</h2>
                  </div>
                </div>
                {project.deployments?.length ? (
                  <div className="deployment-list">
                    {project.deployments.map((deployment) => (
                      <div className="deployment-item" key={deployment.id}>
                        <span className={`deploy-dot ${deployment.status}`} />
                        <div>
                          <b>
                            {deployment.status === "ready"
                              ? "Production deployment"
                              : "Deployment " + deployment.status}
                          </b>
                          <small>{formatDate(deployment.createdAt)}</small>
                          {deployment.error && <em>{deployment.error}</em>}
                        </div>
                        <code>{deployment.id.slice(0, 8)}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-small">
                    <Activity />
                    <b>No deployments recorded</b>
                    <p>
                      Run <code>cloudcalf deploy</code> from your project.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}

function BillingPage({ session }: { session: Session }) {
  const [billing, setBilling] = useState<Billing | null>(null)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const load = () =>
    api<Billing>("/api/billing")
      .then(setBilling)
      .catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])
  const checkout = async (tier: string) => {
    try {
      setBusy(tier)
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy("")
    }
  }
  const portal = async () => {
    try {
      setBusy("portal")
      const { url } = await api<{ url: string }>("/api/billing/portal", {
        method: "POST",
      })
      location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy("")
    }
  }
  return (
    <DashboardShell session={session} active="billing">
      <div className="dash-content">
        <div className="page-title">
          <div>
            <span>BILLING</span>
            <h1>Credits & billing</h1>
            <p>Prepay once, then use credits across every cloudcalf primitive.</p>
          </div>
          {billing?.account.polarCustomerId && (
            <button
              className="button button-ghost button-small"
              onClick={portal}
              disabled={Boolean(busy)}
            >
              <WalletCards size={16} /> Manage billing
            </button>
          )}
        </div>
        {error && <div className="error-banner">{error}</div>}
        {!billing ? (
          <Loading />
        ) : (
          <>
            <section className="credit-banner">
              <div>
                <span className="credit-icon">
                  <Coins />
                </span>
                <div>
                  <span>AVAILABLE BALANCE</span>
                  <strong>{formatCredits(billing.account.creditBalance)}</strong>
                  <p>compute credits</p>
                </div>
              </div>
              <div className="credit-meta">
                <span>
                  Current tier<b>{billing.account.tier}</b>
                </span>
                <span>
                  Payment provider<b>Polar</b>
                </span>
              </div>
            </section>
            <div className="billing-heading">
              <div>
                <span>TOP UP</span>
                <h2>Choose a credit pack</h2>
                <p>Credits never expire. Use a coupon code securely during Polar checkout.</p>
              </div>
            </div>
            <div className="tier-grid">
              {billing.tiers.map((tier, index) => (
                <article className={index === 1 ? "tier-card popular" : "tier-card"} key={tier.id}>
                  {index === 1 && <span className="popular-label">MOST POPULAR</span>}
                  <span>{tier.name.toUpperCase()}</span>
                  <h3>{formatCredits(tier.credits)}</h3>
                  <p>compute credits</p>
                  <ul>
                    <li>
                      <Check /> All Cloudflare primitives
                    </li>
                    <li>
                      <Check /> Unlimited projects
                    </li>
                    <li>
                      <Check /> Credits never expire
                    </li>
                    <li>
                      <Check /> Coupon codes at checkout
                    </li>
                  </ul>
                  <button
                    className={index === 1 ? "button button-primary" : "button button-dark"}
                    disabled={!tier.available || Boolean(busy)}
                    onClick={() => checkout(tier.id)}
                  >
                    {busy === tier.id
                      ? "Opening Polar…"
                      : tier.available
                        ? "Buy credits"
                        : "Coming soon"}
                    <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </div>
            <div className="payment-note">
              <WalletCards />
              <div>
                <b>Secure checkout by Polar</b>
                <p>
                  Cards and eligible wallets are shown by Polar based on your device and region. UPI
                  is not currently exposed as a guaranteed Polar payment method, so the interface
                  does not claim support that the processor cannot provide.
                </p>
              </div>
            </div>
            <section className="panel transaction-panel">
              <div className="panel-head">
                <div>
                  <span>LEDGER</span>
                  <h2>Credit history</h2>
                </div>
              </div>
              {billing.transactions.length ? (
                billing.transactions.map((tx) => (
                  <div className="transaction" key={tx.id}>
                    <span className={tx.amount > 0 ? "tx-positive" : "tx-negative"}>
                      {tx.amount > 0 ? "+" : ""}
                      {formatCredits(tx.amount)}
                    </span>
                    <div>
                      <b>{tx.description}</b>
                      <small>{formatDate(tx.createdAt)}</small>
                    </div>
                    <em>{tx.kind}</em>
                  </div>
                ))
              ) : (
                <div className="empty-small">
                  <Coins />
                  <b>No credit activity yet</b>
                  <p>Your purchases and usage will appear here.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  )
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
}) {
  return (
    <article className="metric">
      <span className="metric-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}
function Loading() {
  return (
    <div className="loading">
      <RefreshCw className="spin" /> Loading your workspace…
    </div>
  )
}
function EmptyProjects() {
  return (
    <div className="empty-projects">
      <span>
        <Layers3 />
      </span>
      <h2>Deploy your first project</h2>
      <p>Open a cloudcalf app in your terminal and ship it to the edge.</p>
      <div className="empty-command">
        <code>cloudcalf login</code>
        <code>cloudcalf deploy</code>
      </div>
    </div>
  )
}

function App() {
  const [path, setPath] = useState(location.pathname)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    const update = () => setPath(location.pathname)
    addEventListener("popstate", update)
    return () => removeEventListener("popstate", update)
  }, [])
  useEffect(() => {
    api<Session>("/api/auth/session")
      .then(setSession)
      .catch(() => setSession(null))
  }, [])
  const page = useMemo(() => {
    if (session === undefined)
      return (
        <div className="boot">
          <Brand />
          <RefreshCw className="spin" />
        </div>
      )
    if (path === "/") return <Home session={session} />
    if (path === "/login")
      return session ? <ProjectsPage session={session} /> : <AuthPage mode="login" />
    if (path === "/signup")
      return session ? <ProjectsPage session={session} /> : <AuthPage mode="signup" />
    if (path === "/dashboard" || path === "/dashboard/")
      return session ? <ProjectsPage session={session} /> : <AuthPage mode="login" />
    if (path === "/dashboard/billing")
      return session ? <BillingPage session={session} /> : <AuthPage mode="login" />
    const project = path.match(/^\/dashboard\/projects\/([^/]+)$/)
    if (project)
      return session ? <ProjectPage session={session} id={project[1]} /> : <AuthPage mode="login" />
    return (
      <main className="not-found">
        <Brand />
        <span>404</span>
        <h1>Nothing at the edge.</h1>
        <Link href="/" className="button button-dark">
          Return home
        </Link>
      </main>
    )
  }, [path, session])
  return page
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

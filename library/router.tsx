// oxlint-disable-next-line typescript/triple-slash-reference -- tsgolint omits ambient virtual modules unless referenced explicitly.
/// <reference path="./virtual.d.ts" />

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react"
import type { AnchorHTMLAttributes, ComponentType, MouseEvent, ReactNode } from "react"

export interface RouteEntry {
  path: string
  component: ComponentType<{ params: Record<string, string> }>
  meta?: {
    title?: string
    description?: string
    favicon?: string
    links?: Record<string, string>[]
    metas?: Record<string, string>[]
  }
}
type RouterValue = {
  path: string
  params: Record<string, string>
  navigate(to: string, options?: { replace?: boolean }): void
}
const RouterContext = createContext<RouterValue | null>(null)

function match(pattern: string, pathname: string) {
  const names: string[] = []
  const expression = pattern
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        names.push(segment.slice(1))
        return "([^/]+)"
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    })
    .join("/")
  const result = new RegExp(`^${expression}/?$`).exec(pathname)
  if (!result) return null
  return Object.fromEntries(
    names.map((name, index) => [name, decodeURIComponent(result[index + 1])]),
  )
}

export function BaseRouter({
  routes,
  notFound: NotFound = DefaultNotFound,
}: {
  routes: RouteEntry[]
  notFound?: ComponentType
}) {
  const current = () => (typeof window === "undefined" ? "/" : window.location.pathname)
  const [path, setPath] = useState(current)
  useEffect(() => {
    const update = () => setPath(current())
    addEventListener("popstate", update)
    return () => removeEventListener("popstate", update)
  }, [])
  const matched = useMemo(
    () =>
      routes
        .map((route) => ({ route, params: match(route.path, path) }))
        .find(({ params }) => params !== null),
    [path, routes],
  )
  useEffect(() => {
    const meta = matched?.route.meta
    if (!meta) return
    if (meta.title) document.title = meta.title
    let el: HTMLElement | null
    if (meta.description) {
      el = document.querySelector('meta[name="description"]')
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute("name", "description")
        document.head.append(el)
      }
      el.setAttribute("content", meta.description)
    }
    if (meta.favicon) {
      el = document.querySelector('link[rel="icon"]')
      if (!el) {
        el = document.createElement("link")
        el.setAttribute("rel", "icon")
        document.head.append(el)
      }
      el.setAttribute("href", meta.favicon)
    }
    if (meta.links) {
      document.querySelectorAll("[data-meta-link]").forEach((e) => e.remove())
      meta.links.forEach((attrs) => {
        const link = document.createElement("link")
        for (const [k, v] of Object.entries(attrs)) link.setAttribute(k, v)
        link.setAttribute("data-meta-link", "")
        document.head.append(link)
      })
    }
    if (meta.metas) {
      document.querySelectorAll("[data-meta-tag]").forEach((e) => e.remove())
      meta.metas.forEach((attrs) => {
        const m = document.createElement("meta")
        for (const [k, v] of Object.entries(attrs)) m.setAttribute(k, v)
        m.setAttribute("data-meta-tag", "")
        document.head.append(m)
      })
    }
  }, [matched])
  const value = useMemo<RouterValue>(
    () => ({
      path,
      params: matched?.params || {},
      navigate(to, options) {
        if (options?.replace) history.replaceState(null, "", to)
        else history.pushState(null, "", to)
        setPath(current())
        scrollTo({ top: 0, behavior: "instant" })
      },
    }),
    [path, matched],
  )
  return (
    <RouterContext.Provider value={value}>
      {matched ? createElement(matched.route.component, { params: matched.params! }) : <NotFound />}
    </RouterContext.Provider>
  )
}

function DefaultNotFound() {
  return (
    <main style={{ maxWidth: 640, margin: "20vh auto", padding: 24, fontFamily: "system-ui" }}>
      <p style={{ color: "#666" }}>404</p>
      <h1>Page not found</h1>
      <p>The address may be incorrect or the page may have moved.</p>
      <Link href="/">Return home</Link>
    </main>
  )
}

export function Link({
  href,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <a
      href={href}
      {...props}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          props.target !== "_blank"
        ) {
          event.preventDefault()
          router.navigate(href)
        }
      }}
    >
      {children}
    </a>
  )
}

export function useRouter() {
  const value = useContext(RouterContext)
  if (!value) throw new Error("useRouter must be used inside Router")
  return value
}

import { routes } from "virtual:cloudcalf/routes"
export function Router() {
  return <BaseRouter routes={routes} />
}

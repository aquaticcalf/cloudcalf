declare module "virtual:cloudcalf/routes" {
  const routes: Array<{
    path: string
    component: import("react").ComponentType<{
      params: Record<string, string>
    }>
    meta?: {
      title?: string
      description?: string
      favicon?: string
      links?: Record<string, string>[]
      metas?: Record<string, string>[]
    }
  }>

  export { routes }
}

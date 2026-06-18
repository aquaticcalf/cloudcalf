export interface CloudApiClient {
  deploy(token: string, name: string, code: string): Promise<{ success: boolean }>
  getWorkerUrl(token: string, name: string): Promise<string>
  createResource(resource: string, data: unknown): Promise<unknown>
  listResources(resource: string): Promise<unknown[]>
}

export function createCloudApi(baseUrl = "https://cloudcalf.dev"): CloudApiClient {
  return {
    async deploy(token, name, code) {
      const res = await fetch(`${baseUrl}/api/cf/worker/deploy`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/javascript",
        },
        body: code,
      })
      return res.json() as any
    },

    async getWorkerUrl(token, name) {
      const res = await fetch(`${baseUrl}/api/cf/worker/url?name=${name}`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      const data = await res.json() as any
      return data.url
    },

    async createResource(resource, data) {
      const res = await fetch(`${baseUrl}/api/cf/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      return res.json() as any
    },

    async listResources(resource) {
      const res = await fetch(`${baseUrl}/api/cf/${resource}`)
      return res.json() as any
    },
  }
}
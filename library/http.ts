const INTERNAL_PREFIX = "/_cloudcalf"

export class CalfcloudError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "CalfcloudError"
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${INTERNAL_PREFIX}${path}`, init)
  if (!response.ok) {
    let details: unknown
    try {
      details = await response.json()
    } catch {
      details = await response.text()
    }
    const message =
      typeof details === "object" && details && "error" in details
        ? String((details as { error: unknown }).error)
        : `Request failed with status ${response.status}`
    throw new CalfcloudError(message, response.status, details)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export { INTERNAL_PREFIX }

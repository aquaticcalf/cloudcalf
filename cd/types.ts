export type NormalizedEventType =
  | "push"
  | "pull_request"
  | "installation"
  | "installation_repositories"
  | "delete"

export interface NormalizedWebhookPayload {
  provider: string
  type: NormalizedEventType
  action?: string
  repository: {
    id: string
    fullName: string
    defaultBranch?: string
  }
  ref?: string
  rawPayload: any
}

export interface WebhookAdapter {
  name: string
  /**
   * determines if this adapter can handle the incoming request
   * (e.g., by checking specific headers like x-github-delivery).
   */
  canHandle(request: Request): boolean

  /**
   * processes the raw request and invokes emitEvent with the normalized payload if valid.
   */
  handleRequest(
    request: Request,
    emitEvent: (event: NormalizedWebhookPayload) => Promise<void> | void,
  ): Promise<void>
}

export interface WebhookHandlerOptions {
  adapters: WebhookAdapter[]
  /** called when code is pushed to a repository */
  onPush?: (payload: NormalizedWebhookPayload) => Promise<void> | void
  /** called when a pull request is opened, synchronized, or closed */
  onPullRequest?: (payload: NormalizedWebhookPayload) => Promise<void> | void
  /** called when the app is installed on an account */
  onInstallation?: (payload: NormalizedWebhookPayload) => Promise<void> | void
  /** called when repositories are added or removed from the app installation */
  onInstallationRepositories?: (payload: NormalizedWebhookPayload) => Promise<void> | void
  /** called when a branch or tag is deleted */
  onDelete?: (payload: NormalizedWebhookPayload) => Promise<void> | void
  /** catch-all callback for all normalized events */
  onEvent?: (payload: NormalizedWebhookPayload) => Promise<void> | void
}

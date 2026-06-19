# cloudcalf : the vision

this document outlines the architecture of the cloudcalf platform and meta framework. our goal is to make building full stack applications on cloudflare completely effortless.

## cloudcalf : the platform

cloudcalf is the platform as a service. it acts as the hosting environment, deployment orchestrator, and dashboard. it completely replaces the need for developers to manage their own cloudflare accounts, use wrangler, or configure infrastructure manually.

the production platform and api are hosted at `https://cloud.calf.lol`. the cloudcalf cli deploys there by default. `CLOUDCALF_API_URL` may override the origin when developing the platform locally.

## cloudcalf : the meta framework

cloudcalf is the package and cli tool that developers install to build their applications. it provides a seamless developer experience with unified file system routing, high level infrastructure primitives natively in the frontend, and automated deployments.

cloudcalf is a framework over vite, not a vite plugin developers configure themselves. cloudcalf owns the vite compiler and local cloudflare runtime. applications are configured through `cloud.config.ts` and run with `cloudcalf dev`, `cloudcalf build`, and `cloudcalf deploy`. advanced vite options remain available through the `vite` escape hatch in `cloud.config.ts`.

## cli authentication

`cloudcalf login` opens the platform's github oauth flow in the developer's browser. `cloudcalf login google` selects google instead, and `--no-browser` prints the url for headless environments. after oauth succeeds, the platform sends the new session to a nonce-bound, one-time loopback callback on `127.0.0.1`. the cli verifies the session with `https://cloud.calf.lol/api/auth/session` before storing it in the operating system's config directory with user-only permissions.

`cloudcalf auth status` verifies and displays the current account. `cloudcalf logout` invalidates the server session and deletes the local credential. `CLOUDCALF_SESSION` remains available as a non-persistent override for ci.

## the tech stack

- frontend : react and vite
- backend : hono
- database : cloudflare d1
- platform : cloudflare workers for platforms

## how the cli works

the cloudcalf cli completely replaces traditional workflows.

### local development

when a developer runs cloudcalf dev, the cli :

1. parses the codebase to find imported cloudcalf resources.
2. bundles the frontend and backend code.
3. boots a local miniflare instance programmatically.
4. mocks the required resources like storage or databases in memory based on the detected frontend imports.

### deployment

when a developer runs cloudcalf deploy, they do not deploy to their own cloudflare account. the cli :

1. analyzes the code to find required infrastructure.
2. bundles the application.
3. uploads the bundle directly to the cloudcalf platform api.
4. the cloudcalf platform receives the code, provisions the required cloudflare resources on our master account, and deploys the worker securely.

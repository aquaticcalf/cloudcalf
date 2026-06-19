# cloudcalf : internal systems

this document details the individual systems and internal packages that make up the cloudcalf ecosystem repository.

## cloud : the platform dashboard

this is the core platform where applications are hosted. it provides a web interface for developers to manage their projects, view logs, and configure deployments. the platform backend receives deployments from the cloudcalf cli and automatically provisions infrastructure using workers for platforms.

## plugin : the cloudcalf cli engine

this system contains the core logic for the cloudcalf developer experience. it acts as a smart cli and build tool.

- it parses application code to automatically discover infrastructure requirements.
- it programmatically runs a local miniflare instance for seamless local development.
- it bundles the code and sends it to the cloud api for deployment.

## cf : infrastructure bindings

this package abstracts the complexity of interacting with raw cloudflare resources. it is used internally by the platform to safely provision and manage resources like d1, kv, r2, queues, vectorize, ai, and durable objects behind the scenes.

## observability : telemetry layer

this system wraps around the cf infrastructure bindings to automatically collect metrics, logs, and traces. it ensures that every interaction with a database, storage bucket, or external api is recorded and available in the platform dashboard.

## oauth : authentication module

this package provides a simple, unified interface for handling social logins. it uses hono and arctic to abstract away the repetitive boilerplate of the oauth authorization code flow. it supports providers like google and github.

## db : the platform database

this system provides a type safe database layer using drizzle orm. it manages the internal state of the cloudcalf platform itself, storing user accounts, project metadata, and deployment histories.

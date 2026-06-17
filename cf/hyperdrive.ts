import type { Hyperdrive } from "@cloudflare/workers-types"

export function createHyperdrive(hyperdrive: Hyperdrive) {
  return {
    connectionString: hyperdrive.connectionString,
    host: hyperdrive.host,
    port: hyperdrive.port,
    database: hyperdrive.database,
    user: hyperdrive.user,
    password: hyperdrive.password,
  }
}

import * as auth from "./auth/schema"
import * as cf from "./cf/schema"

export const schema = { ...auth, ...cf }

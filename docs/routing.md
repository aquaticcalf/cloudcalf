# cloudcalf : full stack routing

this document explains how the cloudcalf meta framework handles both frontend pages and backend routes under the hood.

## file system routing

the cloudcalf framework uses a unified app directory based file system routing approach. the directory structure inside the app folder determines the url paths for both your react frontend and your hono backend.

## frontend pages

to create a user facing web page, you create a file named page.tsx inside the desired folder.

for example, a file placed at app/users/page.tsx automatically maps to the /users url in the browser. inside this file, you simply export a default react component.

here is an example of a page.tsx file :

```tsx
import react from "react"

export default function userspage() {
  return (
    <div>
      <h1>users</h1>
    </div>
  )
}
```

during the build step, the cli scans the app directory, collects all page.tsx files, and automatically generates the react router configuration required to render your frontend.

## backend routes

to create a backend api endpoint, you create a file named route.ts. this can live perfectly colocated alongside your page.tsx files.

for example, a file placed at app/users/route.ts automatically maps to the /users backend endpoint.

inside each route.ts file, you do not need to create a hono instance. instead, you simply export functions named after http methods like get, post, put, or delete.

here is an example of a route.ts file :

```typescript
import { database } from "cloudcalf"

export const get = async (c) => {
  const users = await database.query("select * from users")
  return c.json(users)
}
```

## type safe client rpc

to make full stack development even easier, the cloudcalf framework wraps hono's rpc capabilities into a highly simplified interface.

the cli automatically infers the types from your route.ts files and generates a clean, type safe client. you can simply import the client into your page.tsx and call your backend endpoints directly using the standard http method names.

here is an example of fetching data from the frontend :

```tsx
import { usequery } from "react-query"
import { client } from "cloudcalf/client"

export default function userspage() {
  const { data } = usequery(["users"], async () => {
    const res = await client.users.get()
    return await res.json()
  })

  return (
    <div>
      <h1>users</h1>
      <pre>{json.stringify(data)}</pre>
    </div>
  )
}
```

## under the hood

during development and deployment, the cli elegantly separates these two environments :

1. it bundles all page.tsx files into a static react frontend powered by vite.
2. it bundles all route.ts files into a hidden master hono instance, mapping the directory paths to hono routes.

this gives developers a completely seamless full stack experience, keeping frontend and backend logic perfectly organized together.

# cloudcalf : frontend primitives

this document explains how developers will use cloudflare primitives seamlessly from their frontend code using the cloudcalf library.

## the cloudcalf library

while the cloudcalf platform handles the heavy lifting of infrastructure provisioning, the developer experience is powered entirely by the cloudcalf library.

instead of dealing with raw cloudflare bindings, developers are given heavily simplified, high level primitives that can be imported directly into their frontend components.

## available primitives

the cloudcalf library provides intuitive names for cloudflare resources. here is how you can use all of them directly from the frontend :

### key value storage (kv)

manage simple key value pairs securely.

```tsx
import { storage } from "cloudcalf"

export default function profile() {
  const save = async () => {
    await storage.set("theme", "dark")
  }
}
```

### sql databases (d1)

run sql queries natively without writing proxy routes.

```tsx
import { database } from "cloudcalf"

export default function users() {
  const fetch = async () => {
    return await database.query("select * from users")
  }
}
```

### object storage (r2)

upload and manage files and blobs effortlessly.

```tsx
import { files } from "cloudcalf"

export default function uploader() {
  const upload = async (file) => {
    await files.upload("avatar.png", file)
  }
}
```

### serverless ai (ai)

run machine learning models directly from the client securely.

```tsx
import { ai } from "cloudcalf"

export default function chat() {
  const generate = async () => {
    const response = await ai.run("@cf/meta/llama-3-8b-instruct", {
      prompt: "hello world",
    })
  }
}
```

### vector database (vectorize)

store and query vector embeddings for ai applications.

```tsx
import { vector } from "cloudcalf"

export default function search() {
  const find = async () => {
    return await vector.query([0.1, 0.2, 0.3], { topk: 5 })
  }
}
```

### background jobs (queues)

dispatch asynchronous tasks and background jobs.

```tsx
import { background } from "cloudcalf"

export const sendreceipt = background(async (data) => {
  // this code is automatically split and runs on cloudflare queues securely
})

export default function checkout() {
  const process = async () => {
    // calling this automatically pushes the data to the background queue
    await sendreceipt({ email: "test@example.com" })
  }
}
```

### stateful objects (durable objects)

manage real time state for things like multiplayer games or chat rooms.

```tsx
import { state } from "cloudcalf"

export default function game() {
  const connect = async () => {
    const room = await state.join("room-id")
    room.send("player moved")
  }
}
```

### email routing (email)

send transactional emails effortlessly.

```tsx
import { email } from "cloudcalf"

export default function contact() {
  const send = async () => {
    await email.send({
      to: "user@example.com",
      subject: "welcome",
      text: "hello there",
    })
  }
}
```

## under the hood

by providing these primitives directly in the frontend through the cloudcalf library, we remove the mental overhead of writing backend proxy routes just to read or write basic data.

the cloudcalf library automatically communicates securely with the cloudcalf platform, ensuring that all database queries, ai model executions, and storage operations are handled safely on the backend.

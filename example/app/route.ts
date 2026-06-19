import { storage } from "cloudcalf"

type Todo = { id: string; text: string; done: boolean }

export const get = async (c: any) => {
  const todos = (await storage.get<Todo[]>("todos")) || []
  return c.json(todos)
}

export const post = async (c: any) => {
  const { text } = await c.req.json()
  const todos = (await storage.get<Todo[]>("todos")) || []
  const todo: Todo = { id: crypto.randomUUID(), text, done: false }
  todos.push(todo)
  await storage.set("todos", todos)
  return c.json(todo, 201)
}

export const put = async (c: any) => {
  const body = await c.req.json()
  const todos = (await storage.get<Todo[]>("todos")) || []
  if (body._delete) {
    const filtered = todos.filter((t) => t.id !== body.id)
    await storage.set("todos", filtered)
    return c.json({ success: true })
  }
  const index = todos.findIndex((t) => t.id === body.id)
  if (index === -1) return c.json({ error: "not found" }, 404)
  todos[index] = { ...todos[index], ...body }
  await storage.set("todos", todos)
  return c.json(todos[index])
}

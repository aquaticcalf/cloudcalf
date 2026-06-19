import React, { useState, useEffect, useRef } from "react"
import { client } from "cloudcalf/client"

type Todo = { id: string; text: string; done: boolean }

export const meta = {
  title: "Todos",
  description: "A simple todo app powered by Cloudcalf",
  favicon: "/favicon.svg",
  links: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
    },
  ],
}

const styles = {
  body: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    padding: "2rem 1rem",
    margin: 0,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "540px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)",
    padding: "2rem 1.5rem",
    alignSelf: "flex-start",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  count: {
    fontSize: "0.875rem",
    color: "#94a3b8",
  },
  inputRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  input: {
    flex: 1,
    padding: "0.625rem 1rem",
    fontSize: "0.9375rem",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    outline: "none",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    transition: "border-color .15s, box-shadow .15s",
  },
  addButton: {
    padding: "0.625rem 1.25rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background-color .15s",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 0",
    borderBottom: "1px solid #f1f5f9",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    borderRadius: "6px",
    border: "2px solid #cbd5e1",
    cursor: "pointer",
    flexShrink: 0,
    appearance: "none" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background .15s, border-color .15s",
  },
  checkboxChecked: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  text: {
    flex: 1,
    fontSize: "0.9375rem",
    color: "#0f172a",
    lineHeight: 1.4,
    wordBreak: "break-word" as const,
  },
  textDone: {
    color: "#94a3b8",
    textDecoration: "line-through",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "1.25rem",
    padding: "0.25rem",
    lineHeight: 1,
    transition: "color .15s",
  },
  empty: {
    textAlign: "center" as const,
    color: "#94a3b8",
    fontSize: "0.875rem",
    padding: "2rem 0",
  },
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTodos().catch(() => {})
  }, [])

  const fetchTodos = async () => {
    try {
      const res = await client.get()
      setTodos(await res.json())
    } catch {
      setTodos([])
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setText("")
    try {
      const res = await client.post({ json: { text: trimmed } })
      const todo: Todo = await res.json()
      setTodos((prev) => [...prev, todo])
    } catch {}
    inputRef.current?.focus()
  }

  const toggleTodo = async (id: string, done: boolean) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)))
    try {
      await client.put({ json: { id, done } })
    } catch {}
  }

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    try {
      await client.put({ json: { id, _delete: true } })
    } catch {}
  }

  const remaining = todos.filter((t) => !t.done).length

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>todos</h1>
          <span style={styles.count}>{remaining} left</span>
        </div>

        <form onSubmit={addTodo} style={styles.inputRow}>
          <input
            ref={inputRef}
            style={styles.input}
            type="text"
            placeholder="Add a new todo..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" style={styles.addButton}>
            Add
          </button>
        </form>

        {todos.length === 0 ? (
          <div style={styles.empty}>Nothing to do yet. Add a todo above.</div>
        ) : (
          <ul style={styles.list}>
            {todos.map((todo) => (
              <li key={todo.id} style={styles.item}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id, !todo.done)}
                  style={{
                    ...styles.checkbox,
                    ...(todo.done ? styles.checkboxChecked : {}),
                  }}
                />
                <span
                  style={{
                    ...styles.text,
                    ...(todo.done ? styles.textDone : {}),
                  }}
                >
                  {todo.text}
                </span>
                <button onClick={() => deleteTodo(todo.id)} style={styles.deleteButton}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

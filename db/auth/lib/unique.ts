export async function withUniqueRetry<T>(
  fn: (id: string) => Promise<T>,
  generateId: () => string = () => crypto.randomUUID(),
  maxAttempts = 3,
): Promise<T> {
  let attempts = 0
  while (attempts < maxAttempts) {
    const id = generateId()
    try {
      return await fn(id)
    } catch (e: any) {
      if (e.message?.includes("UNIQUE") && attempts < maxAttempts - 1) {
        attempts++
        continue
      }
      throw e
    }
  }
  throw new Error("failed to generate unique id after retries")
}

import { describe, expect, it, vi } from "vite-plus/test"
import { meterOperation, operationCredits } from "./meter"

describe("operationCredits", () => {
  it("prices expensive primitives above storage reads", () => {
    expect(operationCredits("/ai/run")).toBeGreaterThan(operationCredits("/kv/get"))
    expect(operationCredits("/r2/upload")).toBe(10)
  })

  it("uses a safe default for new operations", () => {
    expect(operationCredits("/future/action")).toBe(1)
  })
})

describe("meterOperation", () => {
  it("records usage and the exact prepaid debit in Analytics Engine", () => {
    const writeDataPoint = vi.fn()
    const credits = meterOperation({ writeDataPoint } as any, "user-1", "calf-notes", "/d1/query")
    expect(credits).toBe(5)
    expect(writeDataPoint).toHaveBeenCalledWith({
      blobs: ["user-1", "d1", "calf-notes", "query"],
      doubles: [1, 5],
      indexes: ["user-1"],
    })
  })
})

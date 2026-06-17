import type { R2Bucket } from "@cloudflare/workers-types"

export function createR2(r2: R2Bucket) {
  return {
    get: (...args: Parameters<R2Bucket["get"]>) => r2.get(...args),
    put: (...args: Parameters<R2Bucket["put"]>) => r2.put(...args),
    delete: (...args: Parameters<R2Bucket["delete"]>) => r2.delete(...args),
    list: (...args: Parameters<R2Bucket["list"]>) => r2.list(...args),
    head: (...args: Parameters<R2Bucket["head"]>) => r2.head(...args),
    createMultipartUpload: (...args: Parameters<R2Bucket["createMultipartUpload"]>) =>
      r2.createMultipartUpload(...args),
    resumeMultipartUpload: (...args: Parameters<R2Bucket["resumeMultipartUpload"]>) =>
      r2.resumeMultipartUpload(...args),
  }
}

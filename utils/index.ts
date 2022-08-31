export const retryFn = async (
  fn: (...x: any) => Promise<any>,
  opts = { maxRetries: 3 }
) => {
  for (let attempt = 1; attempt <= opts?.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      if (attempt <= opts?.maxRetries) {
        console.error(err?.message, `(retry ${attempt}/${opts?.maxRetries})`)
        await sleep(100)
      } else {
        console.error(err?.message)
      }
    }
  }
  throw Error(`failed after ${opts?.maxRetries} retries`)
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

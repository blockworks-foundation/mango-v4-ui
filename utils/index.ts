export const retryFn = async (
  fn: (...x: any) => Promise<any>,
  opts = { maxRetries: 3 }
) => {
  let failureCount = 0
  try {
    if (failureCount < opts?.maxRetries) {
      await fn()
    } else {
      return
    }
  } catch (e) {
    failureCount++
    console.error('Retry: ', e)
  }
}

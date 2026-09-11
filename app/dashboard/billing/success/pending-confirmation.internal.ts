const REFRESH_INTERVAL_MS = 2_000
const CONFIRMATION_TIMEOUT_MS = 12_000

export function startConfirmationPolling(router: {
  refresh: () => void
  replace: (href: string) => void
}) {
  const interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)
  const timeout = setTimeout(() => {
    clearInterval(interval)
    router.replace("/dashboard?billingPending=1")
  }, CONFIRMATION_TIMEOUT_MS)

  return () => {
    clearInterval(interval)
    clearTimeout(timeout)
  }
}

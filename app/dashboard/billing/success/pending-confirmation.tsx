"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { startConfirmationPolling } from "./pending-confirmation.internal"

export function PendingConfirmation() {
  const router = useRouter()

  // RSC refreshes preserve this component and its existing bounded window.
  useEffect(() => startConfirmationPolling(router), [router])

  return (
    <p role="status" aria-live="polite">
      Você será direcionado automaticamente ao dashboard.
    </p>
  )
}

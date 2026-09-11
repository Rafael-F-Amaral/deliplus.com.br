"use client"

import { useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function BillingFeedback({ confirmed }: { confirmed: boolean }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!confirmed) return

    // Consume only presentation hints; retain other query values and history state.
    const url = new URL(window.location.href)
    url.searchParams.delete("billingSuccess")
    url.searchParams.delete("billingPending")
    window.history.replaceState(window.history.state, "", url)
    const timeout = setTimeout(() => setVisible(false), 6_000)
    return () => clearTimeout(timeout)
  }, [confirmed])

  if (!visible) return null

  return (
    <Alert role="status">
      <AlertTitle>
        {confirmed
          ? "Assinatura ativada com sucesso."
          : "Estamos confirmando sua assinatura."}
      </AlertTitle>
      {!confirmed ? (
        <AlertDescription>
          O status será atualizado assim que a confirmação for processada.
        </AlertDescription>
      ) : null}
    </Alert>
  )
}

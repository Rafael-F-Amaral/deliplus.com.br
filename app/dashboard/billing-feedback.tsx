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
    <Alert role="status" className="bg-[#FAF8F0] dark:bg-[#1B241E] border-[#E9E4D4] dark:border-[#2A382E] text-[#1F2E22] dark:text-[#F2EFE9]">
      <AlertTitle className="dark:text-[#F2EFE9]">
        {confirmed
          ? "Assinatura ativada com sucesso."
          : "Estamos confirmando sua assinatura."}
      </AlertTitle>
      {!confirmed ? (
        <AlertDescription className="dark:text-[#9CA79E]">
          O status será atualizado assim que a confirmação for processada.
        </AlertDescription>
      ) : null}
    </Alert>
  )
}

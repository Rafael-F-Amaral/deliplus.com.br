"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RefreshStatus() {
  const router = useRouter()
  return (
    <Button size="lg" onClick={() => router.refresh()}>
      Atualizar status
    </Button>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RefreshStatus() {
  const router = useRouter()
  return (
    <Button
      size="lg"
      className="bg-[#B4482D] hover:bg-[#9E3E26] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] font-semibold cursor-pointer"
      onClick={() => router.refresh()}
    >
      Atualizar status
    </Button>
  )
}

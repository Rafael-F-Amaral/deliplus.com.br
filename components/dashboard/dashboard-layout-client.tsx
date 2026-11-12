"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "./dashboard-header"

export function DashboardLayoutClient({
  children,
  sidebar,
  initialStores = [],
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  initialStores?: { name: string; slug: string }[]
}) {
  const pathname = usePathname()
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean | null>(null)

  useEffect(() => {
    const handleSidebarToggle = (event: Event) => {
      const custom = event as CustomEvent<{ expanded?: boolean; reset?: boolean }>
      if (custom.detail?.reset) {
        setSidebarExpanded(null)
        return
      }
      if (typeof custom.detail?.expanded === "boolean") {
        setSidebarExpanded(custom.detail.expanded)
      }
    }

    window.addEventListener("deliplus:sidebar-toggle", handleSidebarToggle)
    return () => window.removeEventListener("deliplus:sidebar-toggle", handleSidebarToggle)
  }, [])

  if (pathname === "/dashboard/stores/new") {
    return (
      <div className="flex-1 min-h-dvh bg-[#FAF8F0] dark:bg-[#131A15]">
        {children}
      </div>
    )
  }

  const sidebarVarClass =
    sidebarExpanded === null
      ? "[--sidebar-w:0px] lg:[--sidebar-w:76px] xl:[--sidebar-w:260px]"
      : sidebarExpanded
        ? "[--sidebar-w:0px] lg:[--sidebar-w:260px]"
        : "[--sidebar-w:0px] lg:[--sidebar-w:76px]"

  return (
    <div
      className={cn(
        "flex h-dvh overflow-hidden bg-[#FAF8F0] dark:bg-[#131A15] transition-colors duration-150 print:h-auto print:overflow-visible",
        sidebarVarClass
      )}
    >
      {sidebar}

      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-[#FAF8F0] dark:bg-[#131A15] transition-colors duration-150 print:h-auto print:overflow-visible">
        {/* Top Header: Mobile drawer trigger, Theme toggle, Notification bell, User profile */}
        <DashboardHeader initialStores={initialStores} />

        {/* Page Content */}
        <div
          data-dashboard-scroll=""
          className="flex-1 h-full min-h-0 flex flex-col overflow-x-hidden overflow-y-auto bg-[#FAF8F0] dark:bg-[#131A15] max-lg:pb-[calc(76px+env(safe-area-inset-bottom))] print:pb-0 print:h-auto print:overflow-visible transition-colors duration-150"
        >
          {children}
        </div>
      </main>
    </div>
  )
}

"use client"

import { usePathname } from "next/navigation"
import { DashboardHeader } from "./dashboard-header"

export function DashboardLayoutClient({
  children,
  sidebar
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === "/dashboard/stores/new") {
    return <div className="flex-1 min-h-screen bg-[#FAF8F0] dark:bg-[#131A15]">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F0] dark:bg-[#131A15] transition-colors duration-150">
      {sidebar}

      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-[#FAF8F0] dark:bg-[#131A15] transition-colors duration-150">
        {/* Top Header: Theme toggle, Deli notification bell, User profile */}
        <DashboardHeader />

        {/* Page Content */}
        <div
          className={`flex-1 h-full min-h-0 flex flex-col overflow-x-hidden bg-[#FAF8F0] dark:bg-[#131A15] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-colors duration-150 ${
            pathname === "/dashboard/finance"
              ? "overflow-y-auto lg:overflow-hidden"
              : "overflow-y-auto"
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  )
}

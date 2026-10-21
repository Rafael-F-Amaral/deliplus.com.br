"use client"

import { usePathname } from "next/navigation"

export function DashboardLayoutClient({
  children,
  sidebar
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === "/dashboard/stores/new") {
    return <div className="flex-1 min-h-screen bg-[#FAF8F0]">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F0]">
      {sidebar}

      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        {/* Page Content */}
        <div
          className={`flex-1 h-full min-h-0 flex flex-col overflow-x-hidden bg-[#FAF8F0] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
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

import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'
import { getDashboardOverview } from '@/lib/dashboard/dashboard-overview'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await getDashboardOverview().catch(() => null)
  
  // If the user has 0 stores (or if the query fails/auth fails, which will be handled by pages),
  // they should NOT see the dashboard sidebar or shell.
  // In development, or when the user has active stores, render the dashboard shell and sidebar.
  const hasStores =
    process.env.NODE_ENV === 'development' ||
    (result?.status === 'success' && result.overview.stores.total > 0)

  if (!hasStores) {
    return (
      <div className="flex-1 min-h-screen bg-[#F7F6F2]">
        {children}
      </div>
    )
  }

  return (
    <DashboardLayoutClient sidebar={<DashboardSidebar />}>
      {children}
    </DashboardLayoutClient>
  )
}

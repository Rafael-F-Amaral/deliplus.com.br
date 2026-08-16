import { DashboardPreview } from "@/components/dashboard/dashboard-preview"
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard"

export default function DashboardPage() {
  return <><div className="lg:hidden"><MobileDashboard view="overview" /></div><div className="hidden lg:block"><DashboardPreview /></div></>
}

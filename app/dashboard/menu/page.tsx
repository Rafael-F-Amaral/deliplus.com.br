import { DashboardPreview } from "@/components/dashboard/dashboard-preview"
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard"

export default function DashboardMenuPage() {
  return <><div className="lg:hidden"><MobileDashboard view="performance" /></div><div className="hidden lg:block"><DashboardPreview initialView="menu" /></div></>
}

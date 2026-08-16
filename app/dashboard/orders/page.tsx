import { DashboardPreview } from "@/components/dashboard/dashboard-preview"
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard"

export default function DashboardOrdersPage() {
  return <><div className="lg:hidden"><MobileDashboard view="orders" /></div><div className="hidden lg:block"><DashboardPreview initialView="orders" /></div></>
}

import { ReportsView } from "@/components/dashboard/reports/reports-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Relatórios | DeliPlus",
}

export default function RelatoriosPage() {
  return <ReportsView />
}

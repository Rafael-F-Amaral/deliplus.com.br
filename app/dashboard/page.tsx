import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BillingFeedback } from "./billing-feedback"
import { listAccessibleStoreLinks } from "@/lib/stores/accessible-store-links"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getDashboardOverview,
  type DashboardOverview,
} from "@/lib/dashboard/dashboard-overview"

import {
  formatStoreLimit,
  formatTrialValidUntil,
  getPlanLabel,
  getTrialDaysRemaining,
} from "./dashboard-presentation"

export const metadata: Metadata = { title: "Dashboard | Deli Plus" }
export const dynamic = "force-dynamic"

type DashboardSearchParams = Record<string, string | string[] | undefined>

function DashboardStatus({ overview }: { overview: DashboardOverview }) {
  const { entitlement, stores } = overview

  if (!entitlement.entitled) {
    const hasStoreDraft = stores.total > 0

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Publique sua primeira loja</h2>
          </CardTitle>
          <CardDescription>Nenhum plano está ativo no momento.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-base">
            {hasStoreDraft
              ? "Conclua a configuração e publique sua primeira loja para iniciar seus 15 dias grátis."
              : "Configure e publique sua primeira loja para iniciar seus 15 dias grátis."}
          </p>
          <p className="text-sm text-muted-foreground">
            A avaliação começa somente quando a primeira loja é publicada.
          </p>
        </CardContent>
        {!hasStoreDraft ? (
          <CardFooter>
            <Link href="/dashboard/stores/new" className={buttonVariants()}>
              Configurar primeira loja
            </Link>
          </CardFooter>
        ) : null}
      </Card>
    )
  }

  const planLabel = getPlanLabel(entitlement.planCode)

  if (entitlement.source === "trial") {
    const daysRemaining = getTrialDaysRemaining(entitlement.validUntil)

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Teste {planLabel}</h2>
          </CardTitle>
          <CardDescription>
            {daysRemaining === 1
              ? "1 dia restante"
              : `${daysRemaining} dias restantes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Válido até</dt>
              <dd className="text-base font-medium">
                {formatTrialValidUntil(entitlement.validUntil)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Lojas ativas</dt>
              <dd className="text-base font-medium tabular-nums">
                {stores.active}
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard/billing" className={buttonVariants()}>
            Assinar agora
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Plano atual</h2>
        </CardTitle>
        <CardDescription>{planLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="text-base font-medium">Ativo</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Lojas ativas</dt>
            <dd className="text-base font-medium tabular-nums">
              {stores.active}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Limite do plano</dt>
            <dd className="text-base font-medium">
              {formatStoreLimit(entitlement.maxStores)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<DashboardSearchParams>
}) {
  const [query, result, linksResult] = await Promise.all([
    searchParams,
    getDashboardOverview().catch(() => null),
    listAccessibleStoreLinks().catch(() => null),
  ])

  if (result?.status === "unauthenticated") {
    redirect("/sign-in?redirect_url=%2Fdashboard")
  }

  if (
    result?.status === "no_active_organization" ||
    result?.status === "organization_not_provisioned"
  ) {
    redirect("/onboarding")
  }

  const overview = result?.status === "success" ? result.overview : null
  // This query value is presentation-only. Entitlement and Store facts below
  // always come from getDashboardOverview().
  const showPublishedFeedback = query.storePublished === "1"
  const showBillingFeedback =
    overview && (query.billingSuccess === "1" || query.billingPending === "1")

  return (
    <main className="min-h-svh px-6 py-10 sm:px-10 lg:px-16">
      {/* Tela intencionalmente em branco, aguardando prototipo */}
    </main>
  )
}

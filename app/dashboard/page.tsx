import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BillingFeedback } from "./billing-feedback"
import OverviewClient from "./overview-client"
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

export const metadata: Metadata = { title: "Visão Geral | Deli Plus" }
export const dynamic = "force-dynamic"

type DashboardSearchParams = Record<string, string | string[] | undefined>

function DashboardStatus({ overview }: { overview: DashboardOverview }) {
  const { entitlement, stores } = overview

  if (!entitlement.entitled) {
    const hasStoreDraft = stores.total > 0

    return (
      <Card className="bg-white border-[#E3E1D9] rounded-[24px] shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
        <CardHeader>
          <CardTitle className="font-serif text-[20px] text-[#1A241E]">
            <h2>Publique sua primeira loja</h2>
          </CardTitle>
          <CardDescription className="text-[#637267]">
            Nenhum plano está ativo no momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-[14px] text-[#1A241E]">
            {hasStoreDraft
              ? "Conclua a configuração e publique sua primeira loja para iniciar seus 15 dias grátis."
              : "Configure e publique sua primeira loja para iniciar seus 15 dias grátis."}
          </p>
          <p className="text-xs text-[#637267]">
            A avaliação começa somente quando a primeira loja é publicada.
          </p>
        </CardContent>
        {!hasStoreDraft ? (
          <CardFooter>
            <Link
              href="/dashboard/stores/new"
              className="px-4 py-2 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white text-xs font-bold transition-colors"
            >
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
      <Card className="bg-white border-[#E3E1D9] rounded-[24px] shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-serif text-[20px] text-[#1A241E]">
                <h2>Teste {planLabel}</h2>
              </CardTitle>
              <CardDescription className="text-[#CB5A3C] font-semibold">
                {daysRemaining === 1
                  ? "1 dia restante"
                  : `${daysRemaining} dias restantes`}
              </CardDescription>
            </div>
            <Link
              href="/dashboard/billing"
              className="px-4 py-2 rounded-xl bg-[#CB5A3C] hover:bg-[#b54d31] text-white text-xs font-bold transition-colors"
            >
              Assinar agora
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[#FAF8F0] border border-[#ECEAE2]">
              <dt className="text-xs text-[#637267]">Válido até</dt>
              <dd className="text-sm font-bold text-[#1A241E]">
                {formatTrialValidUntil(entitlement.validUntil)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[#FAF8F0] border border-[#ECEAE2]">
              <dt className="text-xs text-[#637267]">Lojas ativas</dt>
              <dd className="text-sm font-bold text-[#1A241E] tabular-nums">
                {stores.active}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-[#E3E1D9] rounded-[24px] shadow-[0_2px_12px_rgba(30,40,30,0.02)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif text-[19px] text-[#1A241E]">
              <h2>Plano atual</h2>
            </CardTitle>
            <CardDescription className="text-[#2E4233] font-bold">
              {planLabel}
            </CardDescription>
          </div>
          <Link
            href="/dashboard/billing"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Planos e assinatura
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[#FAF8F0] border border-[#ECEAE2]">
            <dt className="text-xs text-[#637267]">Status</dt>
            <dd className="text-sm font-bold text-emerald-700">Ativo</dd>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[#FAF8F0] border border-[#ECEAE2]">
            <dt className="text-xs text-[#637267]">Lojas ativas</dt>
            <dd className="text-sm font-bold text-[#1A241E] tabular-nums">
              {stores.active}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[#FAF8F0] border border-[#ECEAE2]">
            <dt className="text-xs text-[#637267]">Limite do plano</dt>
            <dd className="text-sm font-bold text-[#1A241E]">
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

  const accessibleStores =
    linksResult?.status === "success" ? linksResult.stores : null

  return (
    <OverviewClient
      accessibleStores={accessibleStores}
      billingBannerSlot={
        showBillingFeedback ? (
          <BillingFeedback
            confirmed={
              overview.entitlement.entitled &&
              overview.entitlement.source === "paid_subscription"
            }
          />
        ) : null
      }
      publishedBannerSlot={
        showPublishedFeedback ? (
          <Alert role="status" className="bg-emerald-50 border-emerald-200 text-emerald-900 rounded-2xl">
            <AlertTitle className="font-bold">Loja publicada com sucesso.</AlertTitle>
            <AlertDescription>
              Sua loja já pode seguir para as próximas etapas de operação.
            </AlertDescription>
          </Alert>
        ) : null
      }
      statusSlot={
        overview ? (
          <DashboardStatus overview={overview} />
        ) : (
          <Alert role="status" variant="destructive" className="rounded-2xl">
            <AlertTitle>Status indisponível</AlertTitle>
            <AlertDescription>
              Não foi possível carregar o estado do dashboard agora. Atualize a
              página para tentar novamente.
            </AlertDescription>
          </Alert>
        )
      }
    />
  )
}

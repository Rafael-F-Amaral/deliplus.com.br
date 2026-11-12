import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LogoDeli } from "@/components/LogoDeli"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getPlanDefinition,
  isPlanCode,
  type PlanCode,
} from "@/lib/billing/plans"
import { readBillingPageState } from "./billing-state"
import { BillingStatus } from "./billing-status"
import { CheckoutForm, CheckoutSubmit } from "./checkout-form"
import {
  SubscriptionManagementForm,
  SubscriptionManagementSubmit,
} from "./subscription-management-form"

export const metadata: Metadata = { title: "Planos e assinatura | Deli Plus" }
export const dynamic = "force-dynamic"

const plans = [
  {
    code: "essential",
    name: "Essencial",
    price: "99,90",
    description: "Ideal para começar e estruturar sua operação.",
  },
  {
    code: "multi_2",
    name: "Duo",
    price: "189,90",
    description: "Para operações em expansão.",
  },
  {
    code: "multi_3",
    name: "Trio",
    price: "279,90",
    description: "Para pequenas redes.",
  },
] satisfies {
  code: PlanCode
  name: string
  price: string
  description: string
}[]

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [state, query] = await Promise.all([
    readBillingPageState(),
    searchParams ??
      Promise.resolve({} as Record<string, string | string[] | undefined>),
  ])
  if (state.kind === "organization_not_provisioned") redirect("/onboarding")

  const paid =
    state.kind === "resolved" &&
    state.entitlement.entitled &&
    state.entitlement.source === "paid_subscription"
  const disabled = state.kind !== "resolved" || !state.isAdmin || paid
  const billing = state.kind === "resolved" ? state.billing : null
  const portalTargetValue =
    query.portalReturn === "1" && typeof query.targetPlan === "string"
      ? query.targetPlan
      : null
  const portalTargetPlanCode = isPlanCode(portalTargetValue)
    ? portalTargetValue
    : null
  const managementDisabled =
    state.kind !== "resolved" ||
    !state.isAdmin ||
    !billing ||
    billing.status !== "active" ||
    billing.collectionPaused ||
    billing.cancelAtPeriodEnd
  const cards = plans.map((plan) => {
    const capacity = getPlanDefinition(plan.code).maxStores
    const isCurrentPlan = state.kind === "resolved" && state.entitlement.entitled && state.entitlement.planCode === plan.code;
    const isEssential = plan.code === 'essential';
    
    return (
      <Card key={plan.code} className={
          isEssential
            ? "bg-[#FFF0E5] dark:bg-[#251A14] border border-[#B4482D] dark:border-[#FF7D4F] shadow-sm flex flex-col relative"
            : "bg-white dark:bg-[#1B241E] border border-gray-200 dark:border-[#2A382E] shadow-sm flex flex-col relative"
        }>
        <CardHeader className="flex flex-col items-start gap-2 space-y-0 pt-6 pb-0">
          {(isCurrentPlan || isEssential) && (
            <div className="flex w-full flex-wrap items-center justify-between gap-2 min-h-6">
              {isCurrentPlan ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B4482D] dark:bg-[#FF7D4F]" />
                  <span className="text-[10px] font-bold text-[#B4482D] dark:text-[#FF7D4F] uppercase tracking-wider">Plano atual</span>
                </div>
              ) : (
                <span aria-hidden="true" />
              )}
              {isEssential ? (
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white dark:text-[#131A15] bg-[#B4482D] dark:bg-[#FF7D4F] rounded-full">
                  Mais Popular
                </span>
              ) : null}
            </div>
          )}
          <div className="flex flex-col">
            <CardTitle>
              <h2 className="text-2xl font-bold text-[#111827] dark:text-white">{plan.name}</h2>
            </CardTitle>
            <CardDescription className="text-[13px] mt-1 text-[#556358] dark:text-[#A1ADA4] font-medium">{plan.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-5 pt-6 pb-0">
          <p className="flex flex-wrap items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-[#111827] dark:text-white">R$</span>
            <span className="text-4xl font-bold tracking-tighter tabular-nums text-[#111827] dark:text-white">
              {plan.price}
            </span>
            <span className="text-sm font-bold text-[#111827] dark:text-white ml-1">/mês</span>
          </p>
          <div className="flex flex-col gap-2.5">
            <p className="flex items-center gap-2 text-[13px] font-medium text-[#2E4233] dark:text-white">
              <span className="text-[#B4482D] dark:text-[#FF7D4F] text-[15px] font-bold leading-none translate-y-[1px]">✓</span>
              {capacity === 1 ? "1 Estabelecimento" : `Até ${capacity} Estabelecimentos`}
            </p>
            <p className="flex items-center gap-2 text-[13px] font-medium text-[#2E4233] dark:text-white">
              <span className="text-[#B4482D] dark:text-[#FF7D4F] text-[15px] font-bold leading-none translate-y-[1px]">✓</span>
              Todas as funcionalidades
            </p>
            <p className="flex items-center gap-2 text-[13px] font-medium text-[#2E4233] dark:text-white">
              <span className="text-[#B4482D] dark:text-[#FF7D4F] text-[15px] font-bold leading-none translate-y-[1px]">✓</span>
              Suporte prioritário
            </p>
          </div>
        </CardContent>
        <CardFooter className="mt-8 pt-0 pb-6 flex-col items-stretch gap-4">
          {paid && billing ? (
            <SubscriptionManagementSubmit
              planCode={plan.code}
              name={plan.name}
              currentPlanCode={billing.planCode}
              disabled={managementDisabled}
            />
          ) : (
            <CheckoutSubmit
              planCode={plan.code}
              name={plan.name}
              disabled={disabled}
              paid={paid}
            />
          )}
        </CardFooter>
      </Card>
    )
  })
  return (
    <main className="min-h-full w-full bg-transparent px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 lg:pb-12 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:gap-6">
        <header className="flex w-full flex-col gap-4 mt-2 md:mt-0">
          <div className="flex items-center gap-2 mb-2">
            <LogoDeli variant="solid" className="h-10 w-auto block dark:hidden" />
            <LogoDeli variant="outline-white" className="h-10 w-auto hidden dark:block" />
          </div>

          <div className="flex flex-col gap-2 mt-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold tracking-widest text-[#556358] dark:text-[#9CA79E] uppercase">Planos e preços</span>
              <div className="w-8 h-1 bg-[#B4482D] dark:bg-[#FF7D4F] rounded-full"></div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance leading-[1.1] mt-1">
              <span className="text-[#2E4233] dark:text-white">Escolha o plano ideal <br className="hidden sm:block" /></span>
              <span className="text-[#B4482D] dark:text-[#FF7D4F]">para o seu negócio.</span>
            </h1>
            <p className="text-[15px] text-[#556358] dark:text-[#9CA79E] font-medium mt-0.5">
              Mais estrutura, mais controle e mais facilidade para o seu dia a dia.
            </p>
          </div>
        </header>
        
        <div className="mt-0 mb-0">
          <BillingStatus state={state} />
        </div>
        
        <section
          aria-label="Planos disponíveis"
          className="flex flex-col mt-0"
        >
          {paid && billing ? (
            <SubscriptionManagementForm
              disabled={managementDisabled}
              pendingPlanCode={billing.pendingPlanCode}
              pendingEffectiveAt={billing.pendingEffectiveAt}
              currentPlanCode={billing.planCode}
              portalTargetPlanCode={portalTargetPlanCode}
            >
              {cards}
            </SubscriptionManagementForm>
          ) : (
            <CheckoutForm disabled={disabled}>
              {cards}
            </CheckoutForm>
          )}
        </section>
      </div>
    </main>
  )
}

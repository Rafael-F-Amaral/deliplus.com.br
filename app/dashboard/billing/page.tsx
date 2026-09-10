import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPlanDefinition, type PlanCode } from "@/lib/billing/plans"
import { readBillingPageState } from "./billing-state"
import { BillingStatus } from "./billing-status"
import { CheckoutForm, CheckoutSubmit } from "./checkout-form"

export const metadata: Metadata = { title: "Planos e assinatura | Deli Plus" }
export const dynamic = "force-dynamic"

// Commercial presentation only. Provider pricing and eligibility remain server/domain owned.
const plans = [
  {
    code: "essential",
    name: "Essencial",
    price: "99,90",
    description: "Ideal para começar",
  },
  {
    code: "multi_2",
    name: "Duo",
    price: "189,90",
    description: "Para operações em expansão",
  },
  {
    code: "multi_3",
    name: "Trio",
    price: "279,90",
    description: "Para pequenas redes",
  },
] satisfies {
  code: PlanCode
  name: string
  price: string
  description: string
}[]

export default async function BillingPage() {
  const state = await readBillingPageState()
  const paid =
    state.kind === "resolved" &&
    state.entitlement.entitled &&
    state.entitlement.source === "paid_subscription"
  const disabled = state.kind !== "resolved" || !state.isAdmin || paid
  return (
    <main className="min-h-svh px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <nav
          aria-label="Navegação da assinatura"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Voltar ao dashboard
          </Link>
          <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Deli Plus
          </p>
        </nav>
        <header className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            Um plano para o tamanho da sua operação.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            As mesmas funcionalidades. Mais espaço para suas lojas.
          </p>
          {state.kind === "resolved" ? (
            <p className="text-sm text-muted-foreground">
              Organização:{" "}
              <span className="font-medium break-words text-foreground">
                {state.organizationName}
              </span>
            </p>
          ) : null}
        </header>
        <BillingStatus state={state} allowProvisioning />
        <section
          aria-label="Planos disponíveis"
          className="flex flex-col gap-5"
        >
          <CheckoutForm disabled={disabled}>
            {plans.map((plan) => {
              const capacity = getPlanDefinition(plan.code).maxStores
              return (
                <Card key={plan.code}>
                  <CardHeader>
                    <CardTitle>
                      <h2>{plan.name}</h2>
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-6">
                    <p className="flex flex-wrap items-baseline gap-1">
                      <span className="text-base">R$</span>
                      <span className="text-4xl font-semibold tracking-tighter tabular-nums">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </p>
                    <p className="text-base font-medium">
                      {capacity === 1 ? "1 Store" : `Até ${capacity} Stores`}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <CheckoutSubmit
                      planCode={plan.code}
                      name={plan.name}
                      disabled={disabled}
                      paid={paid}
                    />
                  </CardFooter>
                </Card>
              )
            })}
          </CheckoutForm>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Todos os planos incluem o mesmo conjunto principal de
            funcionalidades do Deli Plus. O que muda é a capacidade de lojas.
            Pagamento por cartão no checkout seguro do Stripe.
          </p>
        </section>
      </div>
    </main>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PendingConfirmation } from "./pending-confirmation"
import { RefreshStatus } from "./refresh-status"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { readBillingPageState } from "../billing-state"
import { BillingStatus } from "../billing-status"

export const metadata: Metadata = { title: "Status da assinatura | Deli Plus" }
export const dynamic = "force-dynamic"

export default async function BillingSuccessPage() {
  const state = await readBillingPageState()
  const paid =
    state.kind === "resolved" &&
    state.entitlement.entitled &&
    state.entitlement.source === "paid_subscription"
  if (paid) redirect("/dashboard?billingSuccess=1")

  return (
    <main className="flex min-h-svh items-center px-6 py-16 sm:px-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Deli Plus · Assinatura
        </p>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>
                {state.kind === "resolved"
                  ? "Confirmando sua assinatura..."
                  : "Consulte o status da sua assinatura"}
              </h1>
            </CardTitle>
            <CardDescription>
              {state.kind === "resolved"
                ? "Estamos aguardando a confirmação para atualizar seu plano. Isso normalmente leva apenas alguns instantes."
                : "Consulte o status da sua assinatura para continuar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.kind !== "resolved" ? (
              <BillingStatus state={state} />
            ) : (
              <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Organização:{" "}
                  <span className="font-medium break-words text-foreground">
                    {state.organizationName}
                  </span>
                </p>
                <PendingConfirmation />
                {state.entitlement.entitled &&
                state.entitlement.source === "trial" ? (
                  <p>
                    Seu período de teste continua válido. Ele não é uma
                    confirmação da assinatura paga.
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-wrap gap-3">
            {state.kind !== "resolved" ? <RefreshStatus /> : null}
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Voltar ao dashboard
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

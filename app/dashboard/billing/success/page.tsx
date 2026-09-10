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
                {paid
                  ? "Assinatura confirmada"
                  : state.kind === "resolved"
                    ? "Estamos confirmando sua assinatura"
                    : "Consulte o status da sua assinatura"}
              </h1>
            </CardTitle>
            <CardDescription>
              {paid
                ? "Sua assinatura já está reconhecida no Deli Plus."
                : "O status é atualizado após a confirmação da cobrança. O retorno do checkout, sozinho, não confirma o pagamento."}
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
                <p>
                  {paid
                    ? "Você pode voltar ao dashboard. A configuração e a ativação das suas lojas continuam sendo etapas separadas."
                    : "Ainda não identificamos uma assinatura confirmada. Se você concluiu o checkout, aguarde alguns instantes e atualize o status."}
                </p>
                {!paid &&
                state.entitlement.entitled &&
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
            {!paid ? (
              <a
                href="/dashboard/billing/success"
                className={buttonVariants({ size: "lg" })}
              >
                Atualizar status
              </a>
            ) : null}
            <Link
              href={paid ? "/dashboard" : "/dashboard/billing"}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {paid ? "Voltar ao dashboard" : "Voltar aos planos"}
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

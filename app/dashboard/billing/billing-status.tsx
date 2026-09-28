import Link from "next/link"
import { Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import type { BillingPageState } from "./billing-state"
import { checkoutMessages } from "./checkout-feedback"

export function BillingStatus({ state }: { state: BillingPageState }) {
  if (state.kind !== "resolved") {
    const unavailable = state.kind === "unavailable"
    return (
      <Alert role="status" variant={unavailable ? "destructive" : "default"}>
        <AlertTitle>
          {unavailable ? "Status indisponível" : "Antes de continuar"}
        </AlertTitle>
        <AlertDescription>
          <p>
            {state.kind === "unavailable"
              ? "Não foi possível consultar sua assinatura agora. Atualize a página para tentar novamente."
              : checkoutMessages[state.kind]}
          </p>
          {state.kind === "unauthenticated" ? (
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "outline" })}
            >
              Entrar na conta
            </Link>
          ) : state.kind === "no_active_organization" ? (
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Selecionar organização
            </Link>
          ) : state.kind === "organization_not_provisioned" ? (
            <Link
              href="/onboarding"
              className={buttonVariants({ variant: "outline" })}
            >
              Continuar configuração
            </Link>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }
  const { entitlement, isAdmin } = state
  
  if (entitlement.entitled && entitlement.source === "trial") {
    return (
      <div className="rounded-xl border border-[#F2D7B6] bg-[#FDF6E9] shadow-sm flex gap-3 p-5 items-start w-full mb-2">
        <div className="mt-0.5 shrink-0">
          <Clock className="h-5 w-5 text-[#CB5A3C]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-bold text-foreground">
            Período de teste ativo
          </p>
          <div className="text-[13px] text-muted-foreground font-medium">
            Válido até {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(entitlement.validUntil)}. Assinar não reinicia nem altera seu período de teste.
          </div>
        </div>
      </div>
    )
  }
  
  if (entitlement.entitled && entitlement.source === "paid_subscription") {
    return (
      <div className="rounded-xl border border-gray-200 bg-[#FAF8F0] shadow-sm flex gap-3 p-5 items-start w-full mb-2">
        <div className="mt-0.5 shrink-0">
          <Clock className="h-5 w-5 text-[#2B5C60]" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground">
            Você já possui uma assinatura
          </p>
          <div className="text-sm text-muted-foreground">
            Sua organização está no plano {entitlement.planCode === "essential" ? "Essencial" : entitlement.planCode === "multi_2" ? "Duo" : "Trio"}. Alterações só entram em vigor depois da confirmação do Stripe.
            {!isAdmin ? <p className="mt-1">{checkoutMessages.not_admin}</p> : null}
          </div>
        </div>
      </div>
    )
  }

  return null;
}

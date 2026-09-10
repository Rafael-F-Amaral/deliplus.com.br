import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import type { BillingPageState } from "./billing-state"
import { checkoutMessages } from "./checkout-feedback"
import { OrganizationProvisioningForm } from "./organization-provisioning-form"

export function BillingStatus({
  state,
  allowProvisioning = false,
}: {
  state: BillingPageState
  allowProvisioning?: boolean
}) {
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
          ) : state.kind === "organization_not_provisioned" &&
            state.canProvision &&
            allowProvisioning ? (
            <OrganizationProvisioningForm />
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }
  const { entitlement, isAdmin } = state
  return (
    <Alert role="status">
      <AlertTitle>
        {entitlement.entitled
          ? entitlement.source === "paid_subscription"
            ? "Você já possui uma assinatura"
            : "Seu período de teste está ativo"
          : "Escolha o plano para sua operação"}
      </AlertTitle>
      <AlertDescription>
        <p>
          {entitlement.entitled
            ? entitlement.source === "paid_subscription"
              ? "Sua organização já possui uma assinatura. O gerenciamento estará disponível em uma próxima etapa."
              : `Você está no período de teste do plano ${entitlement.planCode === "essential" ? "Essencial" : entitlement.planCode === "multi_2" ? "Duo" : "Trio"}. Válido até ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(entitlement.validUntil)}. Assinar não reinicia nem altera seu período de teste.`
            : "A cobrança é mensal. Você confere os detalhes antes de confirmar no Stripe."}
        </p>
        {!isAdmin ? <p>{checkoutMessages.not_admin}</p> : null}
      </AlertDescription>
    </Alert>
  )
}

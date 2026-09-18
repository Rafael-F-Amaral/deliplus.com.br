import type { StripeCheckoutResult } from "@/lib/billing/subscription-checkout"

export type CheckoutBusinessStatus = Exclude<
  StripeCheckoutResult["status"],
  "checkout_ready"
>
export type CheckoutActionState =
  | { kind: "idle" }
  | { kind: "business"; status: CheckoutBusinessStatus }
  | { kind: "error" }

export const checkoutMessages = {
  invalid_plan: "Escolha um dos planos disponíveis para continuar.",
  already_subscribed:
    "Sua organização já possui uma assinatura. O gerenciamento da assinatura estará disponível em uma próxima etapa.",
  billing_recovery_required:
    "Precisamos verificar o estado atual da sua cobrança antes de iniciar uma nova assinatura.",
  checkout_in_progress:
    "Já existe um checkout em andamento para esta organização. Para retomá-lo, escolha o mesmo plano.",
  checkout_processing:
    "Estamos processando sua assinatura. Atualize o status para acompanhar a confirmação.",
  unauthenticated: "Entre na sua conta para escolher um plano.",
  no_active_organization:
    "Selecione uma organização na página inicial para continuar.",
  not_admin:
    "Somente um administrador da organização pode iniciar uma assinatura.",
  organization_not_provisioned:
    "Sua organização ainda precisa ser configurada no Deli Plus antes de assinar.",
} satisfies Record<CheckoutBusinessStatus, string>

export const checkoutUnavailableMessage =
  "Não foi possível iniciar o checkout agora. Tente novamente."

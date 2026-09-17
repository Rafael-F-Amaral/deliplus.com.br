import type { SubscriptionManagementResult } from "@/lib/billing/subscription-management.internal"
import type { SubscriptionUpgradePortalResult } from "@/lib/billing/subscription-upgrade-portal.internal"
import type { PlanCode } from "@/lib/billing/plans"

export type SubscriptionManagementActionState =
  | { kind: "idle" }
  | { kind: "error" }
  | {
      kind: "business"
      status:
        | SubscriptionManagementResult["status"]
        | Exclude<SubscriptionUpgradePortalResult["status"], "portal_ready">
      targetPlanCode: PlanCode | null
    }

export const subscriptionManagementMessages: Record<
  | SubscriptionManagementResult["status"]
  | Exclude<SubscriptionUpgradePortalResult["status"], "portal_ready">,
  string
> = {
  downgrade_processing:
    "A redução foi enviada ao Stripe. Seu plano atual permanece ativo enquanto aguardamos a confirmação do webhook.",
  cancellation_processing:
    "O cancelamento da redução foi enviado. Aguarde a confirmação.",
  unauthenticated: "Entre novamente para gerenciar a assinatura.",
  no_active_organization: "Selecione uma organização para continuar.",
  not_admin: "Somente administradores da organização podem alterar o plano.",
  organization_not_provisioned:
    "Conclua a configuração da organização primeiro.",
  invalid_plan: "O plano informado não é válido.",
  same_plan: "Esse já é o plano atual da organização.",
  upgrade_only: "Esse fluxo aceita somente um plano superior ao atual.",
  downgrade_only: "Reduções precisam usar o agendamento do Deli Plus.",
  no_paid_subscription: "Nenhuma assinatura paga foi encontrada.",
  subscription_not_manageable:
    "A assinatura precisa de atenção antes de aceitar uma alteração de plano.",
  scheduled_change_exists:
    "Já existe uma redução agendada. Cancele-a antes de escolher outro plano.",
  no_scheduled_change: "Não há uma redução agendada para cancelar.",
  plan_change_in_progress:
    "Outra alteração de plano já está em andamento. Aguarde a confirmação.",
  billing_recovery_required:
    "Não foi possível confirmar o estado da alteração. Aguarde uma reconciliação segura antes de tentar novamente.",
}

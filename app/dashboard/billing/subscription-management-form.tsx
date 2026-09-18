"use client"

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { PlanCode } from "@/lib/billing/plans"
import {
  cancelScheduledPlanChange,
  scheduleSubscriptionDowngrade,
  startSubscriptionUpgrade,
} from "./actions"
import {
  subscriptionManagementMessages,
  type SubscriptionManagementActionState,
} from "./subscription-management-feedback"
import {
  resolveProjectionConfirmation,
  type SubscriptionManagementSubmission,
} from "./subscription-management-confirmation"

const initialState: SubscriptionManagementActionState = { kind: "idle" }
const rank: Record<PlanCode, number> = { essential: 1, multi_2: 2, multi_3: 3 }
const planName = (plan: PlanCode) =>
  plan === "essential" ? "Essencial" : plan === "multi_2" ? "Duo" : "Trio"

type PlanAction = (payload: FormData) => void
const PlanActionsContext = createContext<{
  upgrade: PlanAction
  downgrade: PlanAction
  markSubmitted: (
    submission: Exclude<SubscriptionManagementSubmission, null>
  ) => void
  busy: boolean
} | null>(null)

function RefreshProjection({
  active,
  complete,
  confirmationKey,
  label,
}: {
  active: boolean
  complete: boolean
  confirmationKey: string
  label: string
}) {
  const router = useRouter()
  const [timedOutFor, setTimedOutFor] = useState<string | null>(null)
  useEffect(() => {
    if (!active || complete) return
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      router.refresh()
      if (count >= 6) {
        window.clearInterval(timer)
        setTimedOutFor(confirmationKey)
      }
    }, 2_000)
    return () => window.clearInterval(timer)
  }, [active, complete, confirmationKey, router])
  if (!active || complete) return null
  const timedOut = timedOutFor === confirmationKey
  return (
    <Alert role="status">
      <AlertTitle>{timedOut ? "Confirmação em andamento" : label}</AlertTitle>
      <AlertDescription>
        {timedOut
          ? "Ainda estamos confirmando a alteração do seu plano. O status será atualizado normalmente quando o webhook for processado."
          : "Aguardando a confirmação segura da projeção local."}
      </AlertDescription>
    </Alert>
  )
}

function Feedback({ state }: { state: SubscriptionManagementActionState }) {
  if (state.kind === "idle") return null
  return (
    <Alert
      role="status"
      variant={state.kind === "error" ? "destructive" : "default"}
    >
      <AlertTitle>
        {state.kind === "error"
          ? "Alteração indisponível"
          : "Sobre sua assinatura"}
      </AlertTitle>
      <AlertDescription>
        {state.kind === "error"
          ? "Não foi possível alterar a assinatura agora. Tente novamente mais tarde."
          : subscriptionManagementMessages[state.status]}
      </AlertDescription>
    </Alert>
  )
}

function PortalReturnFeedback({
  targetPlanCode,
  currentPlanCode,
}: {
  targetPlanCode: PlanCode | null
  currentPlanCode: PlanCode
}) {
  if (!targetPlanCode || targetPlanCode !== currentPlanCode) return null
  return (
    <Alert role="status">
      <AlertTitle>Plano atualizado</AlertTitle>
      <AlertDescription>
        O Stripe confirmou o upgrade para {planName(targetPlanCode)} e a
        projeção local já foi atualizada.
      </AlertDescription>
    </Alert>
  )
}

export function SubscriptionManagementForm({
  children,
  disabled,
  pendingPlanCode,
  pendingEffectiveAt,
  currentPlanCode,
  portalTargetPlanCode,
}: {
  children: ReactNode
  disabled: boolean
  pendingPlanCode: PlanCode | null
  pendingEffectiveAt: Date | null
  currentPlanCode: PlanCode
  portalTargetPlanCode: PlanCode | null
}) {
  const [upgradeState, upgradeAction, upgrading] = useActionState(
    startSubscriptionUpgrade,
    initialState
  )
  const [downgradeState, downgradeAction, downgrading] = useActionState(
    scheduleSubscriptionDowngrade,
    initialState
  )
  const [cancelState, cancelAction, canceling] = useActionState(
    cancelScheduledPlanChange,
    initialState
  )
  const [latestSubmission, setLatestSubmission] =
    useState<SubscriptionManagementSubmission>(null)
  const confirmation = resolveProjectionConfirmation({
    latestSubmission,
    downgradeState,
    cancelState,
    pendingPlanCode,
    currentPlanCode,
    portalTargetPlanCode,
  })
  const feedback =
    latestSubmission === "downgrade"
      ? downgradeState
      : latestSubmission === "cancel"
        ? cancelState
        : latestSubmission === "upgrade"
          ? upgradeState
          : downgradeState.kind !== "idle"
            ? downgradeState
            : cancelState.kind !== "idle"
              ? cancelState
              : upgradeState
  return (
    <div className="flex flex-col gap-6">
      <RefreshProjection
        active={confirmation !== null}
        complete={confirmation?.complete ?? false}
        confirmationKey={confirmation?.key ?? "idle"}
        label={confirmation?.label ?? "Confirmando alteração..."}
      />
      <PortalReturnFeedback
        targetPlanCode={portalTargetPlanCode}
        currentPlanCode={currentPlanCode}
      />
      {pendingPlanCode && pendingEffectiveAt ? (
        <Alert role="status">
          <AlertTitle>Mudança programada</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>
              {planName(currentPlanCode)} → {planName(pendingPlanCode)}. Seu
              plano atual permanece ativo até{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeZone: "America/Sao_Paulo",
              }).format(pendingEffectiveAt)}
              .
            </p>
            <form
              action={cancelAction}
              onSubmit={() => setLatestSubmission("cancel")}
            >
              <Button
                type="submit"
                variant="outline"
                disabled={disabled || canceling}
              >
                {canceling ? "Cancelando…" : "Cancelar redução agendada"}
              </Button>
            </form>
          </AlertDescription>
        </Alert>
      ) : null}
      <PlanActionsContext.Provider
        value={{
          upgrade: upgradeAction,
          downgrade: downgradeAction,
          markSubmitted: setLatestSubmission,
          busy: upgrading || downgrading,
        }}
      >
        <fieldset
          disabled={
            disabled || upgrading || downgrading || Boolean(pendingPlanCode)
          }
          className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-3"
        >
          <legend className="sr-only">Alterar plano mensal</legend>
          {children}
        </fieldset>
      </PlanActionsContext.Provider>
      <div aria-live="polite" aria-atomic="true">
        <Feedback state={feedback} />
      </div>
    </div>
  )
}

export function SubscriptionManagementSubmit({
  planCode,
  name,
  currentPlanCode,
  disabled,
}: {
  planCode: PlanCode
  name: string
  currentPlanCode: PlanCode
  disabled: boolean
}) {
  const actions = useContext(PlanActionsContext)
  if (!actions) throw new Error("Missing subscription-management actions")
  const upgrade = rank[planCode] > rank[currentPlanCode]
  const action = upgrade ? actions.upgrade : actions.downgrade
  return (
    <form
      action={action}
      className="w-full"
      onSubmit={() => actions.markSubmitted(upgrade ? "upgrade" : "downgrade")}
    >
      <SubscriptionManagementButton
        planCode={planCode}
        name={name}
        currentPlanCode={currentPlanCode}
        disabled={disabled || actions.busy}
      />
    </form>
  )
}

function SubscriptionManagementButton({
  planCode,
  name,
  currentPlanCode,
  disabled,
}: {
  planCode: PlanCode
  name: string
  currentPlanCode: PlanCode
  disabled: boolean
}) {
  const { pending, data } = useFormStatus()
  const active = pending && data?.get("planCode") === planCode
  const current = planCode === currentPlanCode
  const actionLabel =
    rank[planCode] > rank[currentPlanCode]
      ? `Fazer upgrade para ${name}`
      : `Agendar downgrade para ${name}`
  return (
    <Button
      type="submit"
      name="planCode"
      value={planCode}
      size="lg"
      variant={current ? "outline" : "default"}
      className="w-full"
      disabled={disabled || pending || current}
    >
      {active ? "Enviando…" : current ? "Plano atual" : actionLabel}
    </Button>
  )
}

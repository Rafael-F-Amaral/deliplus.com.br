"use client"

import { useActionState, type ReactNode } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { PlanCode } from "@/lib/billing/plans"
import { startCheckout } from "./actions"
import {
  checkoutMessages,
  checkoutUnavailableMessage,
  type CheckoutActionState,
} from "./checkout-feedback"

export function CheckoutForm({
  children,
  disabled,
}: {
  children: ReactNode
  disabled: boolean
}) {
  const [state, action, pending] = useActionState<
    CheckoutActionState,
    FormData
  >(startCheckout, { kind: "idle" })
  const blocked =
    state.kind === "business" &&
    state.status !== "invalid_plan" &&
    state.status !== "checkout_in_progress"
  return (
    <form action={action} className="flex flex-col gap-6" aria-busy={pending}>
      <fieldset
        disabled={disabled || pending || blocked}
        className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <legend className="sr-only">Planos de assinatura mensal</legend>
        {children}
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        {pending ? (
          <p className="text-sm text-muted-foreground dark:text-[#9CA79E]">
            Redirecionando para o checkout seguro...
          </p>
        ) : state.kind !== "idle" ? (
          <Alert
            role="status"
            variant={state.kind === "error" ? "destructive" : "default"}
            className="dark:bg-[#1B241E] dark:border-[#2A382E]"
          >
            <AlertTitle className="dark:text-[#F2EFE9]">
              {state.kind === "error"
                ? "Checkout indisponível"
                : "Sobre sua assinatura"}
            </AlertTitle>
            <AlertDescription className="dark:text-[#A1ADA4]">
              {state.kind === "error"
                ? checkoutUnavailableMessage
                : checkoutMessages[state.status]}
              {state.kind === "business" &&
              state.status === "checkout_processing" ? (
                <p className="mt-3">
                  <Link
                    href="/dashboard/billing/success"
                    className={buttonVariants({ variant: "outline", size: "lg" })}
                  >
                    Ver status da assinatura
                  </Link>
                </p>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  )
}

export function CheckoutSubmit({
  planCode,
  name,
  disabled,
  paid,
}: {
  planCode: PlanCode
  name: string
  disabled: boolean
  paid: boolean
}) {
  const { pending, data } = useFormStatus()
  const submitting = pending && data?.get("planCode") === planCode
  return (
    <Button
      type="submit"
      name="planCode"
      value={planCode}
      size="lg"
      className={
        planCode === "essential"
          ? "w-full whitespace-normal h-auto min-h-10 py-2 text-center bg-[#B4482D] hover:bg-[#9E3E26] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] font-semibold shadow-sm cursor-pointer"
          : "w-full whitespace-normal h-auto min-h-10 py-2 text-center bg-[#2E4233] hover:bg-[#1f2c22] dark:bg-[#28382D] dark:hover:bg-[#34483B] dark:border dark:border-[#3D5444] text-white hover:text-white font-semibold shadow-sm cursor-pointer"
      }
      disabled={disabled || pending}
      aria-label={
        paid ? "Sua organização já possui uma assinatura" : `Assinar ${name}`
      }
    >
      {submitting
        ? "Redirecionando..."
        : paid
          ? "Assinatura existente"
          : `Assinar ${name}`}
    </Button>
  )
}

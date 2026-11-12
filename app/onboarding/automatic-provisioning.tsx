"use client"

import { startTransition, useActionState, useEffect, useRef } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  provisionOrganizationForOnboarding,
  type AutomaticProvisioningActionState,
} from "./actions"
import { shouldStartAutomaticProvisioning } from "./automatic-provisioning.internal"

const initialState: AutomaticProvisioningActionState = { kind: "idle" }

const failureMessages = {
  unauthenticated: "Sua sessão terminou. Entre novamente para continuar.",
  no_active_organization:
    "Selecione uma organização antes de continuar a configuração.",
  forbidden:
    "Um administrador da organização precisa concluir esta configuração.",
  provisioning_failed:
    "Não foi possível preparar seu espaço agora. Tente novamente.",
} as const

export function AutomaticProvisioning() {
  const [state, action, pending] = useActionState(
    provisionOrganizationForOnboarding,
    initialState
  )
  const attempted = useRef(false)

  useEffect(() => {
    if (!shouldStartAutomaticProvisioning(attempted.current, state)) return

    attempted.current = true
    startTransition(() => action(new FormData()))
  }, [action, state])

  if (state.kind === "idle" || pending) {
    return (
      <Card aria-live="polite" aria-busy="true" className="bg-white dark:bg-[#1B241E] border-[#E9E4D4] dark:border-[#2A382E] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F2E22] dark:text-[#F2EFE9]">Preparando seu espaço no Deli Plus...</CardTitle>
          <CardDescription className="text-[#525B4E] dark:text-[#9CA79E]">
            Isso deve levar apenas alguns instantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#525B4E] dark:text-[#9CA79E]">
            Mantenha esta página aberta enquanto concluímos a configuração.
          </p>
        </CardContent>
      </Card>
    )
  }

  const message =
    state.kind === "error"
      ? "Não foi possível preparar seu espaço agora. Tente novamente."
      : failureMessages[state.status]

  return (
    <Card className="bg-white dark:bg-[#1B241E] border-[#E9E4D4] dark:border-[#2A382E] shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1F2E22] dark:text-[#F2EFE9]">Não foi possível continuar</CardTitle>
        <CardDescription className="text-[#525B4E] dark:text-[#9CA79E]">
          Sua conta permanece segura e nenhuma assinatura foi iniciada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert role="alert" variant="destructive" className="dark:bg-[#251A14]/40 dark:border-red-900/50">
          <AlertTitle className="dark:text-red-300">Configuração interrompida</AlertTitle>
          <AlertDescription className="dark:text-red-200/90">{message}</AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <form action={action}>
          <Button
            type="submit"
            size="lg"
            className="min-h-10 bg-[#B4482D] hover:bg-[#9E3E26] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] font-semibold cursor-pointer"
            disabled={pending}
            aria-disabled={pending}
          >
            {pending ? "Tentando novamente..." : "Tentar novamente"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

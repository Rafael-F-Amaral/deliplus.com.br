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
      <Card aria-live="polite" aria-busy="true">
        <CardHeader>
          <CardTitle>Preparando seu espaço no Deli Plus...</CardTitle>
          <CardDescription>
            Isso deve levar apenas alguns instantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
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
    <Card>
      <CardHeader>
        <CardTitle>Não foi possível continuar</CardTitle>
        <CardDescription>
          Sua conta permanece segura e nenhuma assinatura foi iniciada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert role="alert" variant="destructive">
          <AlertTitle>Configuração interrompida</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <form action={action}>
          <Button type="submit" disabled={pending} aria-disabled={pending}>
            {pending ? "Tentando novamente..." : "Tentar novamente"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

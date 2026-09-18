"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { StoreSetupView } from "@/lib/stores/store-setup"

import { mutateStoreSetupAction, type StoreSetupActionState } from "./actions"

const initialState: StoreSetupActionState = { kind: "idle" }

const lifecycleLabels = {
  draft: "Rascunho",
  ready: "Pronta para publicar",
  active: "Publicada",
  inactive: "Inativa",
} as const

const businessMessages = {
  invalid_input: "Revise os dados enviados e tente novamente.",
  unauthenticated: "Entre novamente para continuar.",
  no_active_organization: "Escolha uma organização para continuar.",
  forbidden: "Apenas administradores podem configurar lojas.",
  not_admin: "Apenas administradores podem publicar lojas.",
  organization_not_provisioned:
    "Conclua a preparação da organização antes de continuar.",
  store_unavailable: "Esta loja não está disponível nesta organização.",
  slug_unavailable: "Esse endereço já está em uso. Escolha outro.",
  setup_changed: "A loja mudou em outra sessão. Atualize a página e revise.",
  not_ready: "Salve os dados e marque a loja como pronta antes de publicar.",
  subscription_required: "Para publicar esta loja, escolha um plano.",
  capacity_reached:
    "Seu plano já atingiu o limite de lojas ativas. Revise sua assinatura.",
} as const

function StoreSetupButtons({ editable }: { editable: boolean }) {
  const { pending, data } = useFormStatus()
  const intent = data?.get("intent")

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="submit"
        name="intent"
        value="save"
        variant="outline"
        disabled={!editable || pending}
      >
        {pending && intent === "save" ? "Salvando…" : "Salvar alterações"}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="ready"
        variant="secondary"
        disabled={!editable || pending}
      >
        {pending && intent === "ready" ? "Confirmando…" : "Marcar como pronta"}
      </Button>
      <Button type="submit" name="intent" value="publish" disabled={pending}>
        {pending && intent === "publish" ? "Publicando…" : "Publicar loja"}
      </Button>
    </div>
  )
}

export function StoreSetupForm({ store }: { store: StoreSetupView }) {
  const [state, action] = useActionState(mutateStoreSetupAction, initialState)
  const currentStore = state.kind === "store" ? state.store : store
  const [name, setName] = useState(store.name)
  const [slug, setSlug] = useState(store.slug)
  const editable =
    currentStore.status === "draft" || currentStore.status === "ready"
  const nameInvalid = state.kind === "business" && state.issue?.field === "name"
  const slugInvalid = state.kind === "business" && state.issue?.field === "slug"

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="storeId" value={currentStore.id} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Etapa atual:{" "}
        <span className="font-medium text-foreground">
          {lifecycleLabels[currentStore.status]}
        </span>
      </p>

      <FieldGroup>
        <Field
          data-disabled={!editable || undefined}
          data-invalid={nameInvalid || undefined}
        >
          <FieldLabel htmlFor="store-name">Nome da loja</FieldLabel>
          <Input
            id="store-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!editable}
            aria-invalid={nameInvalid || undefined}
            required
          />
          <FieldError>
            {nameInvalid ? "Informe um nome para a loja." : null}
          </FieldError>
        </Field>
        <Field
          data-disabled={!editable || undefined}
          data-invalid={slugInvalid || undefined}
        >
          <FieldLabel htmlFor="store-slug">Endereço público</FieldLabel>
          <Input
            id="store-slug"
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            disabled={!editable}
            aria-invalid={slugInvalid || undefined}
            required
          />
          <FieldDescription>
            Alterações salvam a loja como rascunho até uma nova confirmação.
          </FieldDescription>
          <FieldError>
            {slugInvalid ? "Use um endereço válido e disponível." : null}
          </FieldError>
        </Field>
      </FieldGroup>

      {state.kind === "store" ? (
        <Alert>
          <AlertTitle>
            {state.status === "saved" ? "Alterações salvas" : "Loja pronta"}
          </AlertTitle>
          <AlertDescription>
            {state.status === "saved"
              ? "Revise os dados e confirme quando estiver tudo pronto."
              : "Agora você pode publicar a loja."}
          </AlertDescription>
        </Alert>
      ) : state.kind === "business" ? (
        <Alert>
          <AlertTitle>Esta etapa precisa de atenção</AlertTitle>
          <AlertDescription>
            <p>{businessMessages[state.status]}</p>
            {state.status === "subscription_required" ||
            state.status === "capacity_reached" ? (
              <Link
                href="/dashboard/billing"
                className={buttonVariants({ variant: "outline" })}
              >
                Ver planos e assinatura
              </Link>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : state.kind === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível concluir a ação</AlertTitle>
          <AlertDescription>
            Tente novamente. Nenhuma regra de publicação foi ignorada.
          </AlertDescription>
        </Alert>
      ) : null}

      <StoreSetupButtons editable={editable} />
    </form>
  )
}

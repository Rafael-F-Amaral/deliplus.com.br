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
import { cn } from "@/lib/utils"

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
        size="lg"
        className="min-h-10 dark:border-[#2A382E] dark:bg-[#25332A] dark:text-[#F2EFE9] dark:hover:bg-[#2E3F34] cursor-pointer"
        disabled={!editable || pending}
      >
        {pending && intent === "save" ? "Salvando…" : "Salvar alterações"}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="ready"
        variant="secondary"
        size="lg"
        className="min-h-10 bg-[#2E4233] hover:bg-[#233327] dark:bg-[#28382D] dark:hover:bg-[#34483B] text-white cursor-pointer"
        disabled={!editable || pending}
      >
        {pending && intent === "ready" ? "Confirmando…" : "Marcar como pronta"}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="publish"
        size="lg"
        className="min-h-10 bg-[#B4482D] hover:bg-[#9E3E26] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] font-semibold cursor-pointer"
        disabled={pending}
      >
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

      <p className="text-sm text-[#525B4E] dark:text-[#9CA79E]" aria-live="polite">
        Etapa atual:{" "}
        <span className="font-medium text-[#1F2E22] dark:text-[#F2EFE9]">
          {lifecycleLabels[currentStore.status]}
        </span>
      </p>

      <FieldGroup>
        <Field
          data-disabled={!editable || undefined}
          data-invalid={nameInvalid || undefined}
        >
          <FieldLabel htmlFor="store-name" className="text-[#1F2E22] dark:text-[#F2EFE9]">Nome da loja</FieldLabel>
          <Input
            id="store-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!editable}
            aria-invalid={nameInvalid || undefined}
            className="min-h-10 text-base lg:text-sm bg-white dark:bg-[#131A15] border-[#E9E4D4] dark:border-[#2A382E] text-[#1F2E22] dark:text-[#F2EFE9]"
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
          <FieldLabel htmlFor="store-slug" className="text-[#1F2E22] dark:text-[#F2EFE9]">Endereço público</FieldLabel>
          <Input
            id="store-slug"
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            disabled={!editable}
            aria-invalid={slugInvalid || undefined}
            className="min-h-10 text-base lg:text-sm bg-white dark:bg-[#131A15] border-[#E9E4D4] dark:border-[#2A382E] text-[#1F2E22] dark:text-[#F2EFE9]"
            required
          />
          <FieldDescription className="text-[#525B4E] dark:text-[#9CA79E]">
            Alterações salvam a loja como rascunho até uma nova confirmação.
          </FieldDescription>
          <FieldError>
            {slugInvalid ? "Use um endereço válido e disponível." : null}
          </FieldError>
        </Field>
      </FieldGroup>

      {state.kind === "store" ? (
        <Alert className="dark:bg-[#25332A] dark:border-[#2A382E]">
          <AlertTitle className="dark:text-[#F2EFE9]">
            {state.status === "saved" ? "Alterações salvas" : "Loja pronta"}
          </AlertTitle>
          <AlertDescription className="dark:text-[#9CA79E]">
            {state.status === "saved"
              ? "Revise os dados e confirme quando estiver tudo pronto."
              : "Agora você pode publicar a loja."}
          </AlertDescription>
        </Alert>
      ) : state.kind === "business" ? (
        <Alert className="dark:bg-[#25332A] dark:border-[#2A382E]">
          <AlertTitle className="dark:text-[#F2EFE9]">Esta etapa precisa de atenção</AlertTitle>
          <AlertDescription className="dark:text-[#9CA79E]">
            <p>{businessMessages[state.status]}</p>
            {state.status === "subscription_required" ||
            state.status === "capacity_reached" ? (
              <Link
                href="/dashboard/billing"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-3 dark:border-[#2A382E] dark:bg-[#1B241E] dark:text-[#F2EFE9] dark:hover:bg-[#2E3F34]"
                )}
              >
                Ver planos e assinatura
              </Link>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : state.kind === "error" ? (
        <Alert variant="destructive" className="dark:bg-[#251A14]/40 dark:border-red-900/50">
          <AlertTitle className="dark:text-red-300">Não foi possível concluir a ação</AlertTitle>
          <AlertDescription className="dark:text-red-200/90">
            Tente novamente. Nenhuma regra de publicação foi ignorada.
          </AlertDescription>
        </Alert>
      ) : null}

      <StoreSetupButtons editable={editable} />
    </form>
  )
}

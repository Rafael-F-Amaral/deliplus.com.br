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

import {
  createAndPublishStoreAction,
  type NewStoreActionState,
} from "./actions"
import {
  applyStoreNameChange,
  applyStoreSlugChange,
  createInitialNewStoreFields,
} from "./slug-suggestion"

const initialState: NewStoreActionState = { kind: "idle" }

const businessMessages = {
  invalid_input: "Revise os dados da loja e tente novamente.",
  unauthenticated: "Entre novamente para continuar.",
  no_active_organization: "Escolha uma organização antes de criar a loja.",
  forbidden: "Apenas administradores podem criar lojas.",
  organization_not_provisioned:
    "Conclua a preparação da organização antes de criar a loja.",
  store_unavailable:
    "Esta loja não está mais disponível. Abra a configuração para revisar.",
  slug_unavailable: "Esse endereço já está em uso. Escolha outro.",
  setup_changed:
    "A loja mudou em outra sessão. Abra a configuração para revisar.",
  not_ready: "A loja precisa ser confirmada novamente antes da publicação.",
  not_admin: "Apenas administradores podem publicar lojas.",
  subscription_required: "Escolha um plano para publicar esta loja.",
  capacity_reached:
    "Seu plano já atingiu o limite de lojas ativas. Revise sua assinatura.",
} as const

function CreateStoreButton({ stage }: { stage?: "draft" | "ready" }) {
  const { pending } = useFormStatus()
  const label =
    stage === "draft"
      ? "Tentar concluir novamente"
      : stage === "ready"
        ? "Tentar publicar novamente"
        : "Criar e publicar minha loja"

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Criando e publicando…" : label}
    </Button>
  )
}

export function NewStoreForm({ initialName = "" }: { initialName?: string }) {
  const [state, action] = useActionState(
    createAndPublishStoreAction,
    initialState
  )
  const [fields, setFields] = useState(() =>
    createInitialNewStoreFields(initialName)
  )
  const recovery = state.kind === "idle" ? undefined : state.recovery
  const fieldsLocked = Boolean(recovery)
  const nameInvalid = state.kind === "business" && state.issue?.field === "name"
  const slugInvalid = state.kind === "business" && state.issue?.field === "slug"

  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field
          data-disabled={fieldsLocked || undefined}
          data-invalid={nameInvalid || undefined}
        >
          <FieldLabel htmlFor="store-name">Nome da loja</FieldLabel>
          <Input
            id="store-name"
            name="name"
            value={fields.name}
            onChange={(event) =>
              setFields((current) =>
                applyStoreNameChange(current, event.target.value)
              )
            }
            autoComplete="organization"
            placeholder="Pizzaria do Bairro"
            disabled={fieldsLocked}
            aria-invalid={nameInvalid || undefined}
            required
          />
          <FieldError>
            {nameInvalid ? "Informe um nome para a loja." : null}
          </FieldError>
        </Field>
        <Field
          data-disabled={fieldsLocked || undefined}
          data-invalid={slugInvalid || undefined}
        >
          <FieldLabel htmlFor="store-slug">Endereço público</FieldLabel>
          <Input
            id="store-slug"
            name="slug"
            value={fields.slug}
            onChange={(event) =>
              setFields((current) =>
                applyStoreSlugChange(current, event.target.value)
              )
            }
            autoComplete="off"
            placeholder="pizzaria-do-bairro"
            disabled={fieldsLocked}
            aria-invalid={slugInvalid || undefined}
            required
          />
          <FieldDescription>
            {fieldsLocked
              ? "A loja já foi criada. Use a recuperação abaixo para continuar."
              : `Seu endereço público será /${fields.slug || "endereco-da-loja"}.`}
          </FieldDescription>
          <FieldError>
            {slugInvalid ? "Use pelo menos 3 letras ou números." : null}
          </FieldError>
        </Field>
      </FieldGroup>

      {state.kind !== "idle" ? (
        <Alert variant={state.kind === "error" ? "destructive" : "default"}>
          <AlertTitle>
            {recovery
              ? recovery.stage === "draft"
                ? "Sua loja foi criada"
                : "Sua loja está pronta para publicar"
              : state.kind === "error"
                ? "Não foi possível criar a loja"
                : "Revise esta etapa"}
          </AlertTitle>
          <AlertDescription>
            <p>
              {state.kind === "error"
                ? recovery
                  ? "A loja foi preservada. Tente continuar novamente ou abra a configuração para revisar."
                  : "Tente novamente. Se o problema continuar, volte mais tarde."
                : businessMessages[state.status]}
            </p>
            {recovery ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/stores/${recovery.storeId}/setup`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Abrir configuração da loja
                </Link>
                {state.kind === "business" &&
                (state.status === "subscription_required" ||
                  state.status === "capacity_reached") ? (
                  <Link
                    href="/dashboard/billing"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Ver planos e assinatura
                  </Link>
                ) : null}
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <CreateStoreButton stage={recovery?.stage} />
    </form>
  )
}

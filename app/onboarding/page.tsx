import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { OrganizationList } from "@clerk/nextjs"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"

import { AutomaticProvisioning } from "./automatic-provisioning"
import { readOnboardingCoordinatorState } from "./onboarding-state"

export const metadata: Metadata = { title: "Configuração inicial | Deli Plus" }
export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const state = await readOnboardingCoordinatorState()

  if (state.kind === "unauthenticated") {
    redirect("/sign-in?redirect_url=%2Fonboarding")
  }

  if (state.kind === "redirect") {
    redirect(state.destination)
  }

  return (
    <main className="flex min-h-svh items-center px-6 py-16 sm:px-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Deli Plus
          </p>
          <h1 className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            Vamos preparar seu espaço.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Primeiro, escolha a organização que representa o seu negócio.
          </p>
        </header>

        {state.kind === "no_active_organization" ? (
          <OrganizationList
            hidePersonal
            afterCreateOrganizationUrl="/onboarding"
            afterSelectOrganizationUrl="/onboarding"
          />
        ) : state.kind === "organization_not_provisioned" &&
          state.canProvision ? (
          <AutomaticProvisioning />
        ) : (
          <Alert
            role="status"
            variant={state.kind === "unavailable" ? "destructive" : "default"}
          >
            <AlertTitle>
              {state.kind === "unavailable"
                ? "Configuração indisponível"
                : "Aguardando um administrador"}
            </AlertTitle>
            <AlertDescription>
              <p>
                {state.kind === "unavailable"
                  ? "Não foi possível consultar sua configuração agora. Tente novamente."
                  : "Esta organização precisa ser configurada por um administrador antes de você continuar."}
              </p>
              <Link
                href={state.kind === "unavailable" ? "/onboarding" : "/"}
                className={buttonVariants({ variant: "outline" })}
              >
                {state.kind === "unavailable"
                  ? "Tentar novamente"
                  : "Escolher outra organização"}
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  )
}

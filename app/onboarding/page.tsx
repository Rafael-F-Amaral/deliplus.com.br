import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { OrganizationList } from "@clerk/nextjs"
import { shadcn } from "@clerk/themes"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <main className="flex min-h-dvh items-center bg-[#FAF8F0] dark:bg-[#131A15] text-[#1F2E22] dark:text-[#F2EFE9] px-4 py-12 sm:px-6 md:px-10 transition-colors">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#B4482D] dark:text-[#FF7D4F] uppercase">
            Deli Plus
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter text-balance text-[#1F2E22] dark:text-[#F2EFE9] sm:text-5xl">
            Vamos preparar seu espaço.
          </h1>
          <p className="text-base leading-relaxed text-[#525B4E] dark:text-[#9CA79E] sm:text-lg">
            Primeiro, escolha a organização que representa o seu negócio.
          </p>
        </header>

        {state.kind === "no_active_organization" ? (
          <div className="deliplus-clerk-auth w-full">
            <OrganizationList /* @ts-expect-error type mismatch */
              appearance={{ baseTheme: shadcn }}
              hidePersonal
              afterCreateOrganizationUrl="/onboarding"
              afterSelectOrganizationUrl="/onboarding"
            />
          </div>
        ) : state.kind === "organization_not_provisioned" &&
          state.canProvision ? (
          <AutomaticProvisioning />
        ) : (
          <Alert
            role="status"
            variant={state.kind === "unavailable" ? "destructive" : "default"}
            className="bg-white dark:bg-[#1B241E] border-[#E9E4D4] dark:border-[#2A382E]"
          >
            <AlertTitle className="dark:text-[#F2EFE9]">
              {state.kind === "unavailable"
                ? "Configuração indisponível"
                : "Aguardando um administrador"}
            </AlertTitle>
            <AlertDescription className="dark:text-[#9CA79E]">
              <p>
                {state.kind === "unavailable"
                  ? "Não foi possível consultar sua configuração agora. Tente novamente."
                  : "Esta organização precisa ser configurada por um administrador antes de você continuar."}
              </p>
              <Link
                href={state.kind === "unavailable" ? "/onboarding" : "/"}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-3 dark:border-[#2A382E] dark:bg-[#25332A] dark:text-[#F2EFE9] dark:hover:bg-[#2E3F34]"
                )}
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

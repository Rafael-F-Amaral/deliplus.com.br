import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getStoreForSetup } from "@/lib/stores/store-setup"
import { cn } from "@/lib/utils"

import { StoreSetupForm } from "./store-setup-form"

export const metadata: Metadata = { title: "Configurar loja | Deli Plus" }
export const dynamic = "force-dynamic"

export default async function StoreSetupPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  let result

  try {
    result = await getStoreForSetup(storeId)
  } catch {
    result = null
  }

  if (result?.status === "unauthenticated") {
    redirect("/sign-in?redirect_url=%2Fdashboard")
  }

  if (
    result?.status === "no_active_organization" ||
    result?.status === "organization_not_provisioned"
  ) {
    redirect("/onboarding")
  }

  if (result?.status === "forbidden") {
    redirect("/dashboard")
  }

  if (result?.status === "store_unavailable") {
    notFound()
  }

  return (
    <main className="min-h-dvh px-4 py-8 pb-24 lg:pb-12 sm:px-6 lg:px-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#B4482D] dark:text-[#FF7D4F] uppercase">
            Deli Plus · Configuração da loja
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter text-balance text-[#1F2E22] dark:text-[#F2EFE9] sm:text-5xl">
            Prepare sua loja para receber pedidos.
          </h1>
          <p className="text-base leading-relaxed text-[#525B4E] dark:text-[#9CA79E] sm:text-lg">
            Salve os dados, confirme que estão prontos e publique quando quiser.
          </p>
        </header>

        <Card className="bg-white dark:bg-[#1B241E] border-[#E9E4D4] dark:border-[#2A382E] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1F2E22] dark:text-[#F2EFE9]">
              <h2>
                {result?.status === "success" ? result.store.name : "Sua loja"}
              </h2>
            </CardTitle>
            <CardDescription className="text-[#525B4E] dark:text-[#9CA79E]">
              Cada mudança de etapa é explícita e validada no servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result?.status === "success" ? (
              <StoreSetupForm store={result.store} />
            ) : (
              <Alert variant="destructive" className="dark:bg-[#251A14]/40 dark:border-red-900/50">
                <AlertTitle className="dark:text-red-300">Configuração indisponível</AlertTitle>
                <AlertDescription className="dark:text-red-200/90">
                  Não foi possível carregar esta loja agora. Tente novamente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "dark:border-[#2A382E] dark:bg-[#25332A] dark:text-[#F2EFE9] dark:hover:bg-[#2E3F34]"
              )}
            >
              Voltar ao dashboard
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

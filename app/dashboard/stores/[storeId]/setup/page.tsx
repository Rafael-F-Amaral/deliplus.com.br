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
    <main className="min-h-svh px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Deli Plus · Configuração da loja
          </p>
          <h1 className="text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            Prepare sua loja para receber pedidos.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Salve os dados, confirme que estão prontos e publique quando quiser.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>
                {result?.status === "success" ? result.store.name : "Sua loja"}
              </h2>
            </CardTitle>
            <CardDescription>
              Cada mudança de etapa é explícita e validada no servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result?.status === "success" ? (
              <StoreSetupForm store={result.store} />
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Configuração indisponível</AlertTitle>
                <AlertDescription>
                  Não foi possível carregar esta loja agora. Tente novamente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline" })}
            >
              Voltar ao dashboard
            </Link>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

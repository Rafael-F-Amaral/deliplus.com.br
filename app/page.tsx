import {
  OrganizationSwitcher,
  Show,
  UserButton,
} from "@clerk/nextjs"
import Link from "next/link"
import { shadcn } from "@clerk/themes"

import { buttonVariants } from "@/components/ui/button"
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-[#FAF8F0] dark:bg-[#131A15] text-[#1F2E22] dark:text-[#F2EFE9] px-4 py-12 sm:px-10 sm:py-16 lg:px-16 transition-colors duration-150">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-40 size-96 rounded-full border-[4rem] border-[#B4482D]/15 dark:border-[#FF7D4F]/15 sm:-right-24 sm:size-120 pointer-events-none"
      />

      <section className="relative mx-auto flex w-full max-w-5xl 2xl:max-w-6xl flex-col items-start gap-8">
        <div className="flex w-full items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#B4482D] dark:text-[#FF7D4F] uppercase">
            Deli Plus
          </p>
          <StorefrontThemeToggle variant="surface" />
        </div>

        <div className="flex max-w-3xl flex-col gap-5">
          <h1 className="text-4xl leading-[0.98] font-semibold tracking-tighter text-balance text-[#2E4233] dark:text-[#F2EFE9] sm:text-6xl lg:text-7xl">
            Seu delivery, do seu jeito.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#525B4E] dark:text-[#9CA79E] sm:text-xl">
            Uma plataforma para restaurantes, pizzarias, lanchonetes, açaís e
            outros estabelecimentos gerenciarem seus pedidos online em um só
            lugar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 px-5 border-[#E9E4D4] dark:border-[#2A382E] bg-white dark:bg-[#1B241E] text-[#1F2E22] dark:text-[#F2EFE9] hover:bg-[#F3EFE3] dark:hover:bg-[#25332A]"
              )}
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-11 px-5 bg-[#B4482D] hover:bg-[#9E3E26] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] font-semibold"
              )}
            >
              Criar conta
            </Link>
          </Show>

          <Show when="signed-in">
            <Link
              href="/onboarding"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-11 px-5 bg-[#B4482D] hover:bg-[#9E3E26] dark:bg-[#E76F41] dark:hover:bg-[#FF7D4F] text-white dark:text-[#131A15] font-semibold"
              )}
            >
              Acessar Dashboard
            </Link>
            <OrganizationSwitcher /* @ts-expect-error type mismatch */
              appearance={{ baseTheme: shadcn }}
              hidePersonal
              afterCreateOrganizationUrl="/onboarding"
              afterSelectOrganizationUrl="/onboarding"
            />
            <UserButton /* @ts-expect-error type mismatch */
              appearance={{ baseTheme: shadcn }}
            />
          </Show>
        </div>
      </section>
    </main>
  )
}

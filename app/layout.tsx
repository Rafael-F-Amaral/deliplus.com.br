import { ClerkProvider } from "@clerk/nextjs"
import { ptBR } from "@clerk/localizations"

import { Figtree, Geist_Mono, Playfair_Display } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
        playfair.variable,
        playfair.variable
      )}
    >
      <body suppressHydrationWarning>
        <ClerkProvider 
          localization={{
            ...ptBR,
            dividerText: "ou",
            formFieldLabel__emailAddress_username: "E-mail",
            formFieldInputPlaceholder__emailAddress_username: "seuemail@exemplo.com",
            formFieldLabel__password: "Senha",
            formButtonPrimary: "Entrar no painel",
            formFieldAction__forgotPassword: "Esqueci minha senha"
          }}
          
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}

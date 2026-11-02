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
        playfair.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function createStorageMock() {
                  var store = {};
                  return {
                    getItem: function(key) { return store[key] !== undefined ? store[key] : null; },
                    setItem: function(key, val) { store[key] = String(val); },
                    removeItem: function(key) { delete store[key]; },
                    clear: function() { store = {}; },
                    key: function(i) { return Object.keys(store)[i] || null; },
                    get length() { return Object.keys(store).length; }
                  };
                }
                try {
                  var test = window.localStorage;
                  if (!test) throw new Error();
                  test.getItem("__test__");
                } catch (e) {
                  try {
                    Object.defineProperty(window, "localStorage", {
                      value: createStorageMock(),
                      configurable: true,
                      enumerable: true,
                      writable: true
                    });
                  } catch (err) {}
                }
                try {
                  var testSession = window.sessionStorage;
                  if (!testSession) throw new Error();
                  testSession.getItem("__test__");
                } catch (e) {
                  try {
                    Object.defineProperty(window, "sessionStorage", {
                      value: createStorageMock(),
                      configurable: true,
                      enumerable: true,
                      writable: true
                    });
                  } catch (err) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-background text-foreground transition-colors duration-150">
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
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}

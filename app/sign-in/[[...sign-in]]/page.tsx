'use client'

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Eye, Check, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { AuthLayout } from "@/components/AuthLayout"

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [keepSigned, setKeepSigned] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push("/dashboard")
      } else {
        setError("Algo deu errado. Verifique suas credenciais.")
      }
    } catch (err: any) {
      setError(err.errors[0]?.longMessage || "Email ou senha incorretos.")
    }
  }

  const signInWithGoogle = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard",
    })
  }

  return (
    <AuthLayout isSignIn={true}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[#333] font-medium text-[13px]">E-mail</label>
          <input 
            type="email" 
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="seuemail@exemplo.com"
            className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[40px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[14px] px-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] transition-all placeholder:text-gray-400 outline-none w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-1 relative">
          <label className="text-[#333] font-medium text-[13px]">Senha</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[40px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[14px] px-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] transition-all placeholder:text-gray-400 outline-none w-full font-mono tracking-widest"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Eye size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <a href="#" className="text-[#25392B] text-[12px] font-semibold hover:underline underline-offset-4 decoration-1">Esqueci minha senha</a>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1 cursor-pointer group w-fit" onClick={() => setKeepSigned(!keepSigned)}>
          <div className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-colors border ${keepSigned ? 'bg-[#25392B] border-[#25392B]' : 'bg-[#FAF9F5] border-gray-300 group-hover:border-[#25392B]'}`}>
            {keepSigned && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
          <span className="text-[#333] text-[13px] font-medium">Manter minha sessão neste dispositivo</span>
        </div>

        <button 
          type="submit" 
          className="bg-[#2B3A2F] hover:bg-[#1E2921] text-white h-[44px] rounded-[8px] text-[15px] font-medium transition-colors w-full shadow-md flex items-center justify-center gap-2"
        >
          Entrar no painel <span className="text-[16px] font-light leading-none mb-[1px]">→</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-dotted border-gray-300"></div>
          <span className="text-[#333] text-[12px] font-medium">ou</span>
          <div className="flex-1 border-t border-dotted border-gray-300"></div>
        </div>

        {/* Google SSO Button */}
        <button 
          onClick={signInWithGoogle}
          type="button"
          className="flex items-center justify-center gap-2 w-full h-[44px] bg-transparent border border-[#E5E2D9] rounded-[8px] text-[#333] text-[14px] font-medium hover:bg-gray-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.69 17.6V20.35H19.26C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.26 20.35L15.69 17.6C14.71 18.25 13.46 18.65 12 18.65C9.18 18.65 6.79 16.74 5.92 14.19H2.23V17.05C4.03 20.63 7.72 23 12 23Z" fill="#34A853"/>
            <path d="M5.92 14.19C5.7 13.53 5.57 12.78 5.57 12C5.57 11.22 5.7 10.47 5.92 9.81V6.95H2.23C1.49 8.42 1.07 10.15 1.07 12C1.07 13.85 1.49 15.58 2.23 17.05L5.92 14.19Z" fill="#FBBC05"/>
            <path d="M12 5.35C13.62 5.35 15.07 5.9 16.21 6.99L19.34 3.86C17.45 2.1 14.97 1 12 1C7.72 1 4.03 3.37 2.23 6.95L5.92 9.81C6.79 7.26 9.18 5.35 12 5.35Z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>

        {/* Footer Area inside the form */}
        <div className="w-full flex flex-col items-center mt-3 gap-3">
          <div className="text-[#555] text-[13px]">
            Ainda não tem uma conta? <Link href="/sign-up" className="text-[#CB5A3C] font-semibold hover:underline underline-offset-4 decoration-1">Criar minha loja</Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[#666] text-[11px]">
            <ShieldCheck size={14} strokeWidth={1.5} />
            <span className="flex items-center gap-1">
              Ambiente seguro para lojistas <img src="/logo-deli.png" alt="DELi" className="h-[12px] object-contain ml-0.5 opacity-80" />
            </span>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}

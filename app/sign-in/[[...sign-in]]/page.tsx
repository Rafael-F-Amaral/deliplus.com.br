'use client'

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Eye, Check } from "lucide-react"
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

  return (
    <AuthLayout isSignIn={true}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[#333] font-medium text-[14px]">E-mail</label>
          <input 
            type="email" 
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="seuemail@exemplo.com"
            className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[48px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[15px] px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400 outline-none w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 relative">
          <label className="text-[#333] font-medium text-[14px]">Senha</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[48px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[15px] px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400 outline-none w-full font-mono tracking-widest"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Eye size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="absolute right-0 -bottom-6">
            <a href="#" className="text-[#25392B] text-[13px] font-medium hover:underline underline-offset-4">Esqueci minha senha</a>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 mb-1 cursor-pointer group w-fit" onClick={() => setKeepSigned(!keepSigned)}>
          <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center transition-colors border ${keepSigned ? 'bg-[#25392B] border-[#25392B]' : 'bg-transparent border-gray-300 group-hover:border-[#25392B]'}`}>
            {keepSigned && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
          <span className="text-[#333] text-[13px]">Manter minha sessão neste dispositivo</span>
        </div>

        <button 
          type="submit" 
          className="bg-[#2B3A2F] hover:bg-[#1E2921] text-white h-[52px] rounded-[10px] text-[16px] font-medium transition-colors w-full shadow-md flex items-center justify-center gap-2 mt-1"
        >
          Entrar no painel <span className="text-[18px] font-light leading-none mb-[1px]">→</span>
        </button>
      </form>
    </AuthLayout>
  )
}

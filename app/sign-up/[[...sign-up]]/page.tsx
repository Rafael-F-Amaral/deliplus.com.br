'use client'

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Eye, MailCheck } from "lucide-react"
import { AuthLayout } from "@/components/AuthLayout"

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send the verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      // Change the UI to the verification step
      setPendingVerification(true)
      setError("")
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      setError(err.errors[0]?.longMessage || "Ocorreu um erro ao criar a conta.")
    }
  }

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push("/onboarding")
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2))
        setError("Não foi possível verificar. Tente novamente.")
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      setError(err.errors[0]?.longMessage || "Código inválido.")
    }
  }

  return (
    <AuthLayout isSignIn={false}>
      {!pendingVerification ? (
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
            <label className="text-[#333] font-medium text-[14px]">Criar Senha</label>
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
          </div>

          <button 
            type="submit" 
            className="bg-[#2B3A2F] hover:bg-[#1E2921] text-white h-[52px] rounded-[10px] text-[16px] font-medium transition-colors w-full shadow-md flex items-center justify-center gap-2 mt-4"
          >
            Continuar <span className="text-[18px] font-light leading-none mb-[1px]">→</span>
          </button>
        </form>
      ) : (
        <form onSubmit={onPressVerify} className="flex flex-col gap-5 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#2B3A2F]/10 flex items-center justify-center text-[#2B3A2F]">
              <MailCheck size={24} />
            </div>
          </div>
          
          <div>
            <h3 className="text-[#25392B] text-xl font-semibold mb-2">Verifique seu e-mail</h3>
            <p className="text-[#555] text-sm mb-6">
              Enviamos um código de 6 dígitos para o e-mail<br/>
              <span className="font-medium text-[#333]">{emailAddress}</span>
            </p>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[#333] font-medium text-[14px]">Código de verificação</label>
            <input 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código"
              className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[48px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[16px] px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400 outline-none w-full text-center tracking-[0.5em] font-medium"
              required
            />
          </div>

          <button 
            type="submit" 
            className="bg-[#2B3A2F] hover:bg-[#1E2921] text-white h-[52px] rounded-[10px] text-[16px] font-medium transition-colors w-full shadow-md mt-4"
          >
            Verificar e Entrar
          </button>
          
          <button 
            type="button"
            onClick={() => setPendingVerification(false)}
            className="text-[#555] text-sm font-medium hover:text-[#333] mt-2"
          >
            Voltar e corrigir e-mail
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

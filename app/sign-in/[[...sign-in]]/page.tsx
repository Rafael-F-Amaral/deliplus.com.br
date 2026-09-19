'use client'

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, Check } from "lucide-react"

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
        console.log(result)
        setError("Algo deu errado. Verifique suas credenciais.")
      }
    } catch (err: any) {
      console.error("error", err.errors[0]?.longMessage)
      setError(err.errors[0]?.longMessage || "Email ou senha incorretos.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F5F2] font-sans relative overflow-hidden selection:bg-[#CB5A3C]/20">
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>

      <div className="relative z-10 w-full max-w-[600px] flex flex-col items-center px-4 py-12">
        
        {/* Logo - DELi with + as the dot on the i */}
        <div className="mb-8 relative flex items-center justify-center">
          {/* We use a web font from Google Fonts that resembles the script in the logo */}
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap');
            .logo-font { font-family: 'Caveat', cursive; }
            .serif-font { font-family: 'Playfair Display', serif; }
          `}} />
          
          <div className="logo-font text-[85px] leading-none text-[#25392B] tracking-wide relative">
            DEL<span className="relative">ı<span className="absolute -top-[14px] -right-[6px] text-[40px] text-[#CB5A3C] font-sans font-bold">+</span></span>
          </div>
        </div>

        {/* Headings */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CB5A3C]"></span>
            <span className="text-[#CB5A3C] text-[12px] font-bold tracking-[0.25em] uppercase">Área do lojista</span>
          </div>
          
          <h2 className="serif-font text-[54px] leading-[1.1] mb-4 text-[#25392B]">
            Entre no <span className="text-[#CB5A3C] italic font-medium">seu painel.</span>
          </h2>
          
          <p className="text-[#555] text-[17px] font-medium opacity-80">
            Seu cardápio, sua operação e sua marca, no mesmo lugar.
          </p>
        </div>

        {/* Login Box Wrapper */}
        <div className="relative w-full mb-12">
          
          {/* Partner Tag - 100% custom */}
          <div className="absolute -top-5 -right-8 z-20 transform rotate-[12deg] drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] pointer-events-none">
            {/* The tag body */}
            <div className="bg-[#C56C51] text-[#25392B] text-[11px] font-bold tracking-[0.08em] px-4 py-2.5 rounded-sm relative flex items-center shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] border border-[#b35e45]">
              <div className="flex flex-col items-end leading-[1.2]">
                <span>ACESSO DE</span>
                <span>PARCEIRO</span>
              </div>
              
              {/* Tag Hole and string */}
              <div className="w-3.5 h-3.5 bg-[#F6F5F2] rounded-full ml-3 border-[1.5px] border-[#a04e37] relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                {/* Strings */}
                <svg width="30" height="20" viewBox="0 0 30 20" className="absolute top-1/2 left-full transform -translate-y-1/2 overflow-visible">
                  <path d="M0,10 Q10,0 25,5" fill="none" stroke="#D4B59D" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M0,10 Q10,20 28,15" fill="none" stroke="#D4B59D" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Fully Custom Form */}
          <div className="bg-[#FCFBF8] rounded-[16px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-black/[0.04] p-10 w-full relative z-10">
            <form onSubmit={submit} className="flex flex-col gap-6">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[#333] font-medium text-[15px]">E-mail</label>
                <input 
                  type="email" 
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[52px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[16px] px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400 outline-none w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#333] font-medium text-[15px]">Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-transparent border border-[#E5E2D9] rounded-[8px] h-[52px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[16px] px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400 outline-none w-full font-mono tracking-widest"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Eye size={20} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <a href="#" className="text-[#25392B] text-[13px] font-medium hover:underline underline-offset-4">Esqueci minha senha</a>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 mb-2 cursor-pointer group" onClick={() => setKeepSigned(!keepSigned)}>
                <div className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-colors border ${keepSigned ? 'bg-[#25392B] border-[#25392B]' : 'bg-transparent border-gray-300 group-hover:border-[#25392B]'}`}>
                  {keepSigned && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-[#333] text-[14px]">Manter minha sessão neste dispositivo</span>
              </div>

              <button 
                type="submit" 
                className="bg-[#2B3A2F] hover:bg-[#1E2921] text-white h-[56px] rounded-[10px] text-[17px] font-medium transition-colors w-full shadow-md flex items-center justify-center gap-2"
              >
                Entrar no painel <span className="text-[20px] font-light leading-none mb-0.5">→</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Area */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center w-full justify-center gap-4 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-[#25392B]"></div>
            <div className="flex-1 border-t-2 border-dotted border-gray-300/80"></div>
            <span className="text-[#555] text-[15px] whitespace-nowrap px-2">Acesso direto ao seu espaço de gestão</span>
            <div className="flex-1 border-t-2 border-dotted border-gray-300/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#CB5A3C]"></div>
          </div>

          <div className="text-[#555] text-[16px] mb-8">
            Ainda não tem uma conta? <a href="/sign-up" className="text-[#CB5A3C] font-medium hover:underline underline-offset-4 decoration-1">Criar minha loja</a>
          </div>

          <div className="flex items-center justify-center gap-2 text-[#666] text-[14px]">
            <ShieldCheck size={20} strokeWidth={1.5} />
            <span>Ambiente seguro para lojistas DELi</span>
          </div>
        </div>
      </div>
    </div>
  )
}

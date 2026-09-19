import { ShieldCheck } from "lucide-react"
import Link from "next/link"

export function AuthLayout({ children, isSignIn }: { children: React.ReactNode, isSignIn: boolean }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F6F5F2] font-sans relative overflow-hidden selection:bg-[#CB5A3C]/20">
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>

      <div className="relative z-10 w-full max-w-[680px] flex flex-col items-center px-4">
        
        {/* Logo - Exact Image Provided */}
        <div className="mb-4 relative flex items-center justify-center">
          <img 
            src="/logo-deli.png" 
            alt="DELi+" 
            className="h-[75px] w-auto object-contain drop-shadow-sm" 
          />
        </div>

        {/* Headings */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CB5A3C]"></span>
            <span className="text-[#CB5A3C] text-[12px] font-bold tracking-[0.25em] uppercase">Área do lojista</span>
          </div>
          
          <h2 className="text-[48px] leading-[1.1] mb-2 text-[#25392B]" style={{ fontFamily: '"Playfair Display", serif' }}>
            {isSignIn ? "Entre no " : "Crie "}
            <span className="text-[#CB5A3C] italic font-medium">seu painel.</span>
          </h2>
          
          <p className="text-[#555] text-[16px] font-medium opacity-80">
            Seu cardápio, sua operação e sua marca, no mesmo lugar.
          </p>
        </div>

        {/* Dynamic Box Wrapper (Login or Signup Form) */}
        <div className="relative w-full mb-8">
          <div className="bg-[#FCFBF8] rounded-[16px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-black/[0.04] px-12 py-8 w-full relative z-10">
            {children}
          </div>
        </div>

        {/* Footer Area */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center w-full justify-center gap-4 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-[#25392B]"></div>
            <div className="flex-1 border-t-2 border-dotted border-gray-300/80"></div>
            <span className="text-[#555] text-[14px] whitespace-nowrap px-2">Acesso direto ao seu espaço de gestão</span>
            <div className="flex-1 border-t-2 border-dotted border-gray-300/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#CB5A3C]"></div>
          </div>

          <div className="text-[#555] text-[15px] mb-6">
            {isSignIn ? (
              <>Ainda não tem uma conta? <Link href="/sign-up" className="text-[#CB5A3C] font-medium hover:underline underline-offset-4 decoration-1">Criar minha loja</Link></>
            ) : (
              <>Já possui uma conta? <Link href="/sign-in" className="text-[#CB5A3C] font-medium hover:underline underline-offset-4 decoration-1">Entrar no painel</Link></>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[#666] text-[13px]">
            <ShieldCheck size={18} strokeWidth={1.5} />
            <span>Ambiente seguro para lojistas DELi</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { ShieldCheck } from "lucide-react"

export function AuthLayout({ children, isSignIn }: { children: React.ReactNode, isSignIn: boolean }) {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-[#F6F5F2] font-sans relative overflow-hidden selection:bg-[#CB5A3C]/20 py-4">
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>

      <div className="relative z-10 w-full max-w-[540px] flex flex-col items-center px-4">
        
        {/* Logo */}
        <div className="mb-3 relative flex items-center justify-center">
          <img 
            src="/logo-deli.png" 
            alt="DELi+" 
            className="h-[50px] w-auto object-contain drop-shadow-sm" 
          />
        </div>

        {/* Headings */}
        <div className="text-center mb-5 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C]"></span>
            <span className="text-[#CB5A3C] text-[10px] font-bold tracking-[0.2em] uppercase">
              {isSignIn ? "Área do lojista" : "Comece agora"}
            </span>
          </div>
          
          <h2 className="text-[36px] leading-[1.1] mb-1.5 text-[#25392B]" style={{ fontFamily: '"Playfair Display", serif' }}>
            {isSignIn ? "Entre no " : "Crie "}
            <span className="text-[#CB5A3C] italic font-medium">
              {isSignIn ? "seu painel." : "sua conta."}
            </span>
          </h2>
          
          <p className="text-[#555] text-[14px] font-medium opacity-80">
            {isSignIn ? "Seu cardápio, sua operação e sua marca, no mesmo lugar." : "Coloque sua operação no centro de tudo."}
          </p>
        </div>

        {/* Dynamic Box Wrapper */}
        <div className="relative w-full">
          <div className="bg-[#FCFBF8] rounded-[20px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-black/[0.03] px-8 py-7 w-full relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

import { SignIn } from "@clerk/nextjs"
import { ShieldCheck } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F5F2] font-sans relative overflow-hidden">
      
      {/* Noise overlay for texture (optional, subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center px-4">
        
        {/* Logo */}
        <div className="mb-8 flex items-end">
          <h1 className="text-[52px] font-medium leading-none text-[#2E4233]" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            DELi
          </h1>
          <span className="text-[32px] font-medium leading-none text-[#CB5A3C] ml-1 mb-1">+</span>
        </div>

        {/* Headings */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#CB5A3C]"></span>
            <span className="text-[#CB5A3C] text-[11px] font-bold tracking-[0.2em] uppercase">Área do lojista</span>
          </div>
          
          <h2 className="text-[42px] leading-[1.1] mb-3 text-[#2E4233]" style={{ fontFamily: 'Georgia, serif' }}>
            Entre no <span className="text-[#CB5A3C] italic">seu painel.</span>
          </h2>
          
          <p className="text-[#555] text-[15px]">
            Seu cardápio, sua operação e sua marca, no mesmo lugar.
          </p>
        </div>

        {/* Login Box Wrapper */}
        <div className="relative w-full mb-8">
          
          {/* Partner Tag */}
          <div className="absolute -top-3 -right-6 z-20 transform rotate-[10deg] drop-shadow-md">
            <div className="bg-[#C56C51] text-white text-[10px] font-bold tracking-wider px-4 py-2 rounded-sm relative flex items-center shadow-inner">
              <div className="flex flex-col items-end leading-tight">
                <span>ACESSO DE</span>
                <span>PARCEIRO</span>
              </div>
              {/* Tag Hole and string */}
              <div className="w-2.5 h-2.5 bg-[#F6F5F2] rounded-full ml-3 border border-[#A85A42] relative shadow-inner">
                <div className="absolute top-1/2 left-full w-4 h-[1px] bg-[#D4B59D] transform -translate-y-1/2 rotate-12"></div>
                <div className="absolute top-1/2 left-full w-3 h-[1px] bg-[#D4B59D] transform -translate-y-1/2 -rotate-12 mt-0.5"></div>
              </div>
            </div>
          </div>

          {/* Clerk Component */}
          <div className="bg-[#FAF9F5] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.03] p-1 w-full relative z-10">
            <SignIn 
              fallbackRedirectUrl="/onboarding" 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 bg-transparent w-full p-2 sm:p-4 m-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border-gray-200 text-gray-600 rounded-xl h-11 hover:bg-gray-50",
                  dividerRow: "my-4",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-400 text-xs font-medium",
                  formFieldLabel: "text-[#333] font-medium text-[13px] mb-1.5",
                  formFieldInput: "bg-transparent border border-[#E5E2D9] rounded-[10px] h-11 focus:border-[#2E4233] focus:ring-1 focus:ring-[#2E4233] text-[14px] px-3 shadow-none transition-all placeholder:text-gray-400",
                  formButtonPrimary: "bg-[#2E4233] hover:bg-[#1A261D] text-white h-[46px] rounded-[12px] text-[15px] font-medium transition-colors w-full mt-2 shadow-sm relative",
                  footerAction: "hidden",
                  identityPreview: "border border-[#E5E2D9] rounded-[10px] bg-white",
                  identityPreviewText: "text-[#333]",
                  identityPreviewEditButtonIcon: "text-[#2E4233]",
                  formFieldWarningText: "text-xs",
                  formFieldErrorText: "text-xs text-[#CB5A3C]",
                  formFieldSuccessText: "text-xs",
                  alert: "border border-[#CB5A3C] bg-[#CB5A3C]/10 text-[#CB5A3C]",
                }
              }}
            />
          </div>
        </div>

        {/* Footer Area */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center w-full justify-center gap-4 mb-6 opacity-60">
            <div className="w-2 h-2 rounded-full bg-[#2E4233]"></div>
            <div className="flex-1 border-t border-dashed border-gray-400"></div>
            <span className="text-[#555] text-sm whitespace-nowrap">Acesso direto ao seu espaço de gestão</span>
            <div className="flex-1 border-t border-dashed border-gray-400"></div>
            <div className="w-2 h-2 rounded-full bg-[#CB5A3C]"></div>
          </div>

          <div className="text-[#555] text-[14px] mb-6">
            Ainda não tem uma conta? <a href="/sign-up" className="text-[#CB5A3C] font-medium hover:underline underline-offset-4">Criar minha loja</a>
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

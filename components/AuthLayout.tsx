import { ArrowLeft } from "lucide-react"
import { LogoDeli } from "@/components/LogoDeli"

export type AuthVariant = "sign-in" | "sign-up" | "forgot-password" | "forgot-password-code" | "forgot-password-new" | "forgot-password-success";

export function AuthLayout({ children, variant }: { children: React.ReactNode, variant: AuthVariant }) {
  
  const getSubBadge = () => {
    if (variant === "sign-up") return "Comece agora";
    return "Área do lojista";
  };

  const getTitleStart = () => {
    if (variant === "sign-in") return "Entre no ";
    if (variant === "sign-up") return "Crie sua ";
    if (variant === "forgot-password") return "Recupere ";
    if (variant === "forgot-password-code") return "Confira ";
    if (variant === "forgot-password-new") return "Crie uma ";
    return "";
  };

  const getTitleHighlight = () => {
    if (variant === "sign-in") return "seu painel.";
    if (variant === "sign-up") return "conta.";
    if (variant === "forgot-password") return "sua senha.";
    if (variant === "forgot-password-code") return "seu e-mail.";
    if (variant === "forgot-password-new") return "nova senha.";
    return "";
  };

  const getSubtitle = () => {
    if (variant === "sign-in") return "Seu cardápio, sua operação e sua marca, no mesmo lugar.";
    if (variant === "sign-up") return "";
    if (variant === "forgot-password") return "Vamos te enviar um código de acesso.";
    if (variant === "forgot-password-code") return "Digite o código enviado.";
    if (variant === "forgot-password-new") return "Crie uma nova senha de acesso.";
    return "";
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#2B5C60] md:bg-[#F6F5F2] font-sans relative overflow-x-hidden selection:bg-[#CB5A3C]/20">
      
      {/* MOBILE TOP HEADER (Green background area on mobile) */}
      <div className="md:hidden flex-none bg-[#2B5C60] px-5 pt-8 pb-6 text-white relative z-10">
        
        {/* Back button area */}
        <div className="flex justify-between items-center mb-2">
          <button className="h-[36px] w-[36px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* MOBILE Logo */}
        <div className="mb-8">
          <LogoDeli variant="outline-white" className="h-[48px] w-auto" />
        </div>

      </div>

      {/* Abstract Decorative Graphic (Topographic / Logistics Wave) */}
      <div className="absolute right-[-10%] top-[-20%] w-[250px] h-[250px] text-[#A5B3A6] opacity-[0.25] pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M42.7,-73.4C55.9,-66.5,67.6,-56.3,76.5,-43.8C85.4,-31.3,91.5,-15.7,92.5,0.6C93.5,16.8,89.4,33.7,80.1,47.9C70.8,62.1,56.3,73.6,40.6,80.7C24.9,87.8,8.1,90.5,-7.4,87.3C-22.9,84.1,-37.1,75,-49.6,64.2C-62.1,53.4,-72.9,40.9,-80.1,26.5C-87.3,12.1,-90.9,-4.2,-87.3,-18.9C-83.7,-33.6,-72.9,-46.7,-60.2,-55.8C-47.5,-64.9,-32.9,-70,-18.2,-73.3C-3.5,-76.6,11.3,-78.1,25.4,-77.2C39.5,-76.3,52.9,-73.1,42.7,-73.4Z" transform="translate(100 100) scale(1.1)" />
        </svg>
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full md:max-w-[540px] md:mx-auto flex-1 flex flex-col md:justify-center md:px-4 md:py-2">
        
        {/* DESKTOP Logo */}
        <div className="hidden md:flex mb-2 relative justify-center flex-col items-center text-center w-full mx-auto">
          <LogoDeli variant="solid" className="h-[60px] w-auto drop-shadow-sm" />
        </div>

        {/* DESKTOP Headings (Center Aligned, Outside Card) */}
        {getTitleStart() && (
          <div key={`desktop-${variant}`} className="hidden md:flex text-center mb-2 flex-col items-center justify-center w-full mx-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C]"></span>
              <span className="text-[#CB5A3C] text-[10px] font-bold tracking-[0.2em] uppercase">
                {getSubBadge()}
              </span>
            </div>
            
            <h2 className="text-[36px] leading-[1.1] mb-1.5 text-[#2B5C60]" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              {getTitleStart()}
              <span className="text-[#CB5A3C] italic font-medium">
                {getTitleHighlight().replace('.', '')}
              </span>
              .
            </h2>
            
            <p className="text-[#5E6C60] text-[15px] max-w-[85%] leading-relaxed">
              {getSubtitle()}
            </p>
          </div>
        )}

        {/* WHITE CARD AREA */}
        <div className="bg-[#FCFBFA] md:bg-transparent rounded-t-[24px] md:rounded-none flex-1 md:flex-none -mt-1 md:mt-0 p-6 md:p-0 relative z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] md:shadow-none w-full">
          
          <div className="w-12 h-1.5 bg-[#E5E2D9] rounded-full mx-auto mb-6 md:hidden"></div>
          
          {/* MOBILE Headings (Left Aligned, Inside Card) */}
          {getTitleStart() && (
            <div key={`mobile-${variant}`} className="md:hidden mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C]"></span>
                <span className="text-[#CB5A3C] text-[10px] font-bold tracking-[0.2em] uppercase">
                  {getSubBadge()}
                </span>
              </div>
              
              <h2 className="text-[32px] leading-[1.1] mb-2 text-[#2B5C60]" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                {getTitleStart()}
                <span className="text-[#CB5A3C] italic font-medium">
                  {getTitleHighlight().replace('.', '')}
                </span>
                .
              </h2>
              
              <p className="text-[#5E6C60] text-[14px] leading-relaxed">
                {getSubtitle()}
              </p>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both w-full">
            {children}
          </div>
        </div>
        
      </div>
    </div>
  );
}

import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <AuthLayout variant="sign-up">
      <div className="flex flex-col gap-5 w-full mt-2 min-h-[400px] relative">
        <SignUp 
          appearance={{
            elements: {
              header: "!hidden",
              headerTitle: "!hidden",
              headerSubtitle: "!hidden",
              rootBox: "w-full flex justify-center m-0 p-0",
              cardBox: "w-full m-0 p-0 shadow-none",
              card: "w-full bg-[#FCFBFA] shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[16px] p-8 border border-[#2B5C60]/30",
              main: "flex flex-col gap-5",
              
              formFieldInput: "bg-white border-[#E5E2D9] focus:border-[#2B5C60] focus:ring-[#2B5C60]/20 text-[#333] h-[44px] rounded-[8px] px-3",
              formFieldLabel: "text-[#5E6C60] font-medium text-[13px] mb-1.5",
              
              form: "order-1",
              formFieldRow: "mb-2.5",
              
              formButtonPrimary: "!bg-[#2B5C60] hover:!bg-[#377378] text-white text-[16px] font-semibold tracking-wide h-[48px] rounded-[8px] transition-all shadow-sm flex justify-center items-center",
              formButtonIcon: "!hidden",
              
              socialButtons: "order-3",
              socialButtonsBlockButton: "flex items-center justify-center gap-2 w-full h-[48px] !bg-[#F4F4F5] !border-2 !border-[#D4D4D8] rounded-[8px] !text-[#333] text-[15px] font-bold hover:!bg-[#E4E4E7] transition-all !shadow-md",
              socialButtonsProviderIcon: "w-[18px] h-[18px]",
              socialButtonsBadge: "!hidden",
              badge: "!hidden",
              
              dividerRow: "order-2 flex items-center gap-4 my-2",
              dividerLine: "flex-1 border-t-2 border-dotted border-[#CB5A3C]/50 bg-transparent",
              dividerText: "text-[#CB5A3C] text-[13px] font-medium tracking-wide",
                footer: "!bg-transparent",
                footerAction: "!hidden",
            }
          }}
        />

        <div className="w-full flex flex-col items-center justify-center text-center mx-auto mt-2 gap-4">
          <div className="text-[14px] text-[#555]">
            {"J\u00E1 tem uma conta?"} <Link href="/sign-in" className="text-[#CB5A3C] font-medium hover:underline underline-offset-4 decoration-1">Fazer login</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

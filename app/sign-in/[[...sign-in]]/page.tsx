import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/AuthLayout";
import Link from "next/link";

export default function SignInPage() {
  return (
    <AuthLayout variant="sign-in">
      <div className="deliplus-clerk-auth flex flex-col gap-5 w-full mt-2 min-h-[400px] relative">
        <SignIn 
          appearance={{
            elements: {
              header: "!hidden",
              headerTitle: "!hidden",
              headerSubtitle: "!hidden",
              rootBox: "w-full flex justify-center m-0 p-0",
              cardBox: "w-full m-0 p-0 shadow-none",
              card: "w-full bg-[#FCFBFA] dark:bg-[#1B241E] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] rounded-[16px] p-5 sm:p-8 border border-[#2B5C60]/30 dark:border-[#2A382E]",
              main: "flex flex-col gap-5",
              
              formFieldInput: "bg-white dark:bg-[#131A15] border-[#E5E2D9] dark:border-[#2A382E] focus:border-[#2B5C60] dark:focus:border-[#FF7D4F] focus:ring-[#2B5C60]/20 dark:focus:ring-[#FF7D4F]/20 text-[#333] dark:text-[#F2EFE9] h-[44px] !text-base xl:[@media(hover:hover)]:!text-sm rounded-[8px] px-3",
              formFieldLabel: "text-[#5E6C60] dark:text-[#9CA79E] font-medium text-[13px] mb-1.5",
              
              form: "order-1",
              formFieldRow: "mb-2.5",
              
              formButtonPrimary: "!bg-[#2B5C60] hover:!bg-[#377378] dark:!bg-[#E76F41] dark:hover:!bg-[#FF7D4F] text-white dark:!text-[#131A15] text-[16px] font-semibold tracking-wide h-[48px] rounded-[8px] transition-all shadow-sm flex justify-center items-center",
              formButtonIcon: "!hidden",
              
              socialButtons: "order-3",
              socialButtonsBlockButton: "flex items-center justify-center gap-2 w-full h-[48px] !bg-[#F4F4F5] dark:!bg-[#25332A] !border-2 !border-[#D4D4D8] dark:!border-[#2A382E] rounded-[8px] !text-[#333] dark:!text-[#F2EFE9] text-[15px] font-bold hover:!bg-[#E4E4E7] dark:hover:!bg-[#2E3F34] transition-all !shadow-md",
              socialButtonsProviderIcon: "w-[18px] h-[18px]",
              socialButtonsBadge: "!hidden",
              badge: "!hidden",
              
              dividerRow: "order-2 flex items-center gap-4 my-2",
              dividerLine: "flex-1 border-t-2 border-dotted border-[#B4482D]/50 dark:border-[#FF7D4F]/40 bg-transparent",
              dividerText: "text-[#B4482D] dark:text-[#FF7D4F] text-[13px] font-medium tracking-wide",
                footer: "!bg-transparent",
                footerAction: "!hidden",
            }
          }}
        />

        <div className="w-full flex flex-col items-center justify-center text-center mx-auto mt-2 gap-4">
          <div className="text-[14px] text-[#555] dark:text-[#9CA79E]">
            {"Ainda n\u00E3o tem uma conta?"} <Link href="/sign-up" className="text-[#B4482D] dark:text-[#FF7D4F] font-medium hover:underline underline-offset-4 decoration-1 inline-flex items-center min-h-9 py-1">Criar minha loja</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

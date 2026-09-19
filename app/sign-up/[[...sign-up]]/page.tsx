import { SignUp } from "@clerk/nextjs"
import { AuthLayout } from "@/components/AuthLayout"

export default function SignUpPage() {
  return (
    <AuthLayout isSignIn={false}>
      {/* Container wrapper just to apply styling rules to Clerk's shadow component if needed */}
      <div className="w-full flex justify-center -m-4">
        <SignUp 
          fallbackRedirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "w-full mx-auto shadow-none",
              card: "shadow-none border-0 bg-transparent w-full p-0 m-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border-[#E5E2D9] text-[#333] rounded-[10px] h-[48px] hover:bg-gray-50",
              dividerRow: "my-5",
              dividerLine: "bg-[#E5E2D9]",
              dividerText: "text-gray-400 text-xs font-medium",
              formFieldLabel: "text-[#333] font-medium text-[14px] mb-1.5",
              formFieldInput: "bg-transparent border border-[#E5E2D9] rounded-[8px] h-[48px] focus:border-[#25392B] focus:ring-1 focus:ring-[#25392B] text-[15px] px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-gray-400",
              formButtonPrimary: "bg-[#2B3A2F] hover:bg-[#1E2921] text-white h-[52px] rounded-[10px] text-[16px] font-medium transition-colors w-full mt-2 shadow-md relative",
              footerAction: "hidden",
              identityPreview: "border border-[#E5E2D9] rounded-[10px] bg-white",
              identityPreviewText: "text-[#333]",
              identityPreviewEditButtonIcon: "text-[#2B3A2F]",
              formFieldWarningText: "text-xs",
              formFieldErrorText: "text-xs text-[#CB5A3C]",
              formFieldSuccessText: "text-xs",
              alert: "border border-[#CB5A3C] bg-[#CB5A3C]/10 text-[#CB5A3C]",
              verificationLink: "text-[#2B3A2F] hover:text-[#1E2921]",
              formResendCodeLink: "text-[#2B3A2F] hover:text-[#1E2921]"
            }
          }}
        />
      </div>
    </AuthLayout>
  )
}

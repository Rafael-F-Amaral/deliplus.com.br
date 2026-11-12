import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallback() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4 bg-[#F6F5F2] dark:bg-[#131A15] text-[#2E4233] dark:text-[#F2EFE9] transition-colors duration-150">
      <AuthenticateWithRedirectCallback />
    </div>
  )
}

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F6F5F2]">
      <AuthenticateWithRedirectCallback />
    </div>
  )
}

import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const isAuthPage = url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up');

  let authState = null;
  try {
    authState = await auth();
  } catch (e) {
    // Auth error on invalid session
  }

  // If user is logged in, send them to dashboard
  if (authState?.userId && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is NOT logged in and on an auth page:
  // If the browser has a stale __client_uat > 0 or stale __session, reset __client_uat to 0
  // so Clerk frontend knows the user is unauthenticated and renders the SignIn form!
  if (!authState?.userId && isAuthPage) {
    const cookies = req.cookies.getAll();
    const hasUat = cookies.some(c => c.name.startsWith('__client_uat') && c.value !== '0');
    const hasSession = cookies.some(c => c.name.startsWith('__session'));
    const hasHandshake = cookies.some(c => c.name.startsWith('__clerk_handshake') || c.name.startsWith('__clerk_redirect_count'));

    if (hasUat || hasSession || hasHandshake) {
      const response = NextResponse.next();
      
      // Reset client_uat to 0 (Clerk's explicit signed-out state)
      response.cookies.set('__client_uat', '0', { path: '/', maxAge: 31536000 });
      
      // Delete any specific suffixed UAT cookies
      for (const cookie of cookies) {
        if (cookie.name.startsWith('__client_uat_')) {
          response.cookies.set(cookie.name, '0', { path: '/', maxAge: 31536000 });
        }
        if (cookie.name.startsWith('__session') || cookie.name.startsWith('__clerk_')) {
          response.cookies.set(cookie.name, '', { path: '/', maxAge: 0 });
        }
      }
      return response;
    }
  }

  return NextResponse.next();
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}

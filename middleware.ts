import { clerkMiddleware } from '@clerk/nextjs/server'

// All routes are public — guests are let through without signing in.
// clerkMiddleware() must be present so that auth() works inside API routes.
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

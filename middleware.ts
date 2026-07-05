import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', 
  // Don't blanket protect all /api - use whitelist approach instead
  // '/chat(.*)', // Allow guest access to chat with intake form
]);

// API 路由白名单（不需要 Clerk 认证的公开 API）
const isPublicApiRoute = createRouteMatcher([
  '/api/create-session',  // ChatKit 创建 session（在登录前调用）
  '/api/whisper',         // Whisper 语音转文字 API
  '/api/tools',           // Tools API - authentication checked per-tool in handler
  '/api/demo-auth',       // Demo password verification API
]);

// Protected API routes (require authentication)
const isProtectedApiRoute = createRouteMatcher([
  '/api/migrate-intake',  // Migration needs auth
]);

export default clerkMiddleware(async (auth, req) => {
  // 公开 API 路由不需要 Clerk 认证 - 必须在 protect() 之前返回
  if (isPublicApiRoute(req)) {
    console.log("Public API route, skipping Clerk auth:", req.url);
    return NextResponse.next();
  }

  // Protected API routes require auth
  if (isProtectedApiRoute(req)) {
    await auth.protect();
    console.log("Protected API route, auth required:", req.url);
    return NextResponse.next();
  }

  // 然后执行 Clerk 认证 for other protected routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  console.log("Middleware is running for:", req.url);
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
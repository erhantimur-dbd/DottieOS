import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"

// Routes accessible without authentication
const PUBLIC_PATHS = ['/login', '/affiliate']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Allow public routes (login + all /affiliate/* pages)
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  // Also allow the affiliate API endpoint unauthenticated
  const isPublicApi = pathname.startsWith('/api/affiliate/apply')

  if (!isLoggedIn && !isPublic && !isPublicApi) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}

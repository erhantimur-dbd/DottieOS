import NextAuth from "next-auth"
import { authConfigBase } from "@/lib/auth/config.base"
import { NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

// Edge-safe auth instance (no Prisma/Node imports) for middleware use only.
const { auth } = NextAuth(authConfigBase)

// Routes accessible without authentication
const PUBLIC_PATHS = ['/login', '/affiliate']

// Role-gated route prefixes. A user must hold one of the listed roles to enter.
const ROLE_RULES: { prefix: string; allow: UserRole[] }[] = [
  { prefix: '/settings', allow: ['OWNER', 'ADMIN'] },
  { prefix: '/audit-log', allow: ['OWNER', 'ADMIN'] },
  { prefix: '/daily-updates/approval-queue', allow: ['OWNER', 'ADMIN', 'SUPERVISOR'] },
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role as UserRole | undefined

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

  // Role-based access control
  if (isLoggedIn && role) {
    const rule = ROLE_RULES.find(
      (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/')
    )
    if (rule && !rule.allow.includes(role)) {
      const url = new URL('/dashboard', req.url)
      url.searchParams.set('denied', '1')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}

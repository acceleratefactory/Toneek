// middleware.ts
// Minimal passthrough middleware — required to refresh Supabase auth cookies.
// Stripped to bare minimum to isolate Edge runtime build issues on Vercel.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

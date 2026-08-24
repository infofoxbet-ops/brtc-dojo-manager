import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Basic route protection mapping
  const pathname = request.nextUrl.pathname
  const publicRoutes = ['/login', '/register', '/forgot-password']

  // se è pubblica non fare redirect a login, ma se è autenticato vai in dashboard
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    return supabaseResponse
  }

  // Se non è pubblica e non c'è user, vai al login
  if (!user && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // RBAC base routing
  if (user) {
    const role = user.app_metadata?.role as string

    if (pathname.startsWith('/admin') && role !== 'super-admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/parent') && role !== 'parent') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

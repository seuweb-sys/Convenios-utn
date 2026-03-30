import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ['/sign-in', '/sign-up', '/auth/callback', '/pending-approval', '/forgot-password']
  const homeRoute = '/'
  const protectedRoute = '/protected'

  // Si NO hay usuario
  if (!user) {
    // Permitir home, sign-in, sign-up, auth/callback, pending-approval y APIs públicas
    if (request.nextUrl.pathname === homeRoute ||
      publicRoutes.includes(request.nextUrl.pathname) ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
      return response
    }
    // Cualquier otra ruta -> sign-in con redirect
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Si SÍ hay usuario loggeado
  if (user) {
    // Obtener perfil para verificar is_approved y role
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved, role')
      .eq('id', user.id)
      .single()

    const isApproved = profile?.is_approved === true
    const isAdmin = profile?.role === 'admin'

    // Si está en home, sign-in o sign-up -> verificar aprobación primero
    if (request.nextUrl.pathname === homeRoute ||
      request.nextUrl.pathname === '/sign-in' ||
      request.nextUrl.pathname === '/sign-up') {
      const url = request.nextUrl.clone()

      // Si no está aprobado y no es admin -> pending-approval
      if (!isApproved && !isAdmin) {
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }

      // Si está aprobado o es admin -> protected
      url.pathname = protectedRoute
      return NextResponse.redirect(url)
    }

    // Si está en auth/callback -> permitir (maneja su propia redirección)
    if (request.nextUrl.pathname === '/auth/callback') {
      return response
    }

    // Si está en pending-approval
    if (request.nextUrl.pathname === '/pending-approval') {
      // Si ya está aprobado o es admin -> redirigir a protected
      if (isApproved || isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = protectedRoute
        return NextResponse.redirect(url)
      }
      // Si no está aprobado -> permitir ver pending-approval
      return response
    }

    // Para rutas protegidas (/protected/*)
    if (request.nextUrl.pathname.startsWith('/protected')) {
      // Si no está aprobado y no es admin -> redirigir a pending-approval
      if (!isApproved && !isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }
      // Si está aprobado o es admin -> permitir
      return response
    }

    // Para APIs de negocio (no auth)
    if (request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/api/auth')) {
      // Permitir update-profile incluso si no está aprobado (para completar perfil)
      if (request.nextUrl.pathname === '/api/user/update-profile') {
        return response
      }

      // Si no está aprobado y no es admin -> rechazar con 403
      if (!isApproved && !isAdmin) {
        return new NextResponse(
          JSON.stringify({ error: 'Usuario no aprobado' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return response
    }

    // Cualquier otra ruta -> permitir
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - utn-logo.png (logo UTN)
     */
    '/((?!_next/static|_next/image|favicon.ico|utn-logo.png).*)',
  ],
}

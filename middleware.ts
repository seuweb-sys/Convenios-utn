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

  const publicRoutes = ['/sign-in', '/sign-up', '/auth/callback']
  const homeRoute = '/'
  const protectedRoute = '/protected'

  // Si NO hay usuario
  if (!user) {
    // Permitir home, sign-in, sign-up, auth/callback y APIs
    if (request.nextUrl.pathname === homeRoute || 
        publicRoutes.includes(request.nextUrl.pathname) || 
        request.nextUrl.pathname.startsWith('/api')) {
      return response
    }
    // Cualquier otra ruta -> sign-in
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  // Si SÍ hay usuario loggeado
  if (user) {
    // Si está en home, sign-in o sign-up -> mandar a protected
    if (request.nextUrl.pathname === homeRoute || 
        request.nextUrl.pathname === '/sign-in' || 
        request.nextUrl.pathname === '/sign-up') {
      const url = request.nextUrl.clone()
      url.pathname = protectedRoute
      return NextResponse.redirect(url)
    }
    // Si está en auth/callback -> permitir (maneja su propia redirección)
    if (request.nextUrl.pathname === '/auth/callback') {
      return response
    }
    // Para cualquier otra ruta protegida -> permitir
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

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect");
  
  if (code) {
    const supabase = await createClient();
    
    // Intercambiar el código de OAuth por una sesión
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirigir a la URL original o a protected por defecto
  const redirectUrl = redirect && redirect.startsWith('/protected') ? redirect : "/protected";
  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
}

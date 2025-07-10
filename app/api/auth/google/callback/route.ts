import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Error en OAuth callback:', error);
      return NextResponse.redirect(new URL('/protected?error=oauth_error', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/protected?error=no_code', request.url));
    }

    // Configurar cliente OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No se recibió access token');
    }

    // Guardar tokens en Supabase
    const supabase = await createClient();
    
    // Verificar autenticación del usuario admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(new URL('/sign-in?error=unauthorized', request.url));
    }

    // Verificar que es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/protected?error=admin_required', request.url));
    }

    // Crear/actualizar registro de tokens OAuth
    const { error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Error guardando tokens:', tokenError);
      return NextResponse.redirect(new URL('/protected?error=save_tokens_failed', request.url));
    }

    // Redirigir a página de éxito
    return NextResponse.redirect(new URL('/protected?success=google_connected', request.url));

  } catch (error) {
    console.error('Error en callback OAuth:', error);
    return NextResponse.redirect(new URL('/protected?error=callback_error', request.url));
  }
} 
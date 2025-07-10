import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Para obtener refresh token
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ],
      prompt: 'consent' // Forzar pantalla de consentimiento para obtener refresh token
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generando URL de autorización:', error);
    return NextResponse.json(
      { error: 'Error al iniciar autenticación' },
      { status: 500 }
    );
  }
} 
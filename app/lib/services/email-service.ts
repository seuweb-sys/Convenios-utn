import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface CorrectionEmailData {
  userEmail: string
  userName: string
  convenioTitle: string
  convenioId: string | number
  typeSlug: string
  observaciones: string
  adminName: string
}

export async function sendCorrectionRequestEmail(data: CorrectionEmailData) {
  try {
    const { userEmail, userName, convenioTitle, convenioId, typeSlug, observaciones, adminName } = data

    const correctionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/protected/convenio-detalle/${convenioId}?type=${typeSlug}&mode=correccion`

    const { data: emailData, error } = await resend.emails.send({
      from: 'Convenios UTN <onboarding@resend.dev>', // Cambiar por tu dominio verificado
      to: [userEmail],
      subject: `Solicitud de Corrección - Convenio: ${convenioTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin: 0;">Solicitud de Corrección</h2>
          </div>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>El administrador <strong>${adminName}</strong> ha solicitado correcciones en tu convenio:</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Convenio: ${convenioTitle}</h3>
            <p style="margin: 0; color: #856404;"><strong>Observaciones:</strong></p>
            <p style="margin: 10px 0 0 0; color: #856404;">${observaciones}</p>
          </div>
          
          <p>Para realizar las correcciones necesarias, haz clic en el siguiente enlace:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${correctionUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ir al Convenio
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            Si el enlace no funciona, copia y pega esta URL en tu navegador:<br>
            <a href="${correctionUrl}" style="color: #007bff;">${correctionUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #6c757d; font-size: 12px; text-align: center;">
            Este es un email automático del sistema de Convenios UTN.<br>
            No respondas a este mensaje.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Error enviando email con Resend:', error)
      throw error
    }

    console.log('Email de corrección enviado exitosamente:', emailData)
    return emailData

  } catch (error) {
    console.error('Error en sendCorrectionRequestEmail:', error)
    throw error
  }
} 
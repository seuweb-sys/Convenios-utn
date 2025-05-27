import { NextResponse } from 'next/server';
import { Packer } from 'docx';
import { createClient } from '@/utils/supabase/server';
import { createDocument } from '@/app/lib/utils/doc-generator';
import { uploadFileToDrive } from '@/app/lib/google-drive';

export async function POST(request: Request) {
  try {
    const { templateId, fields } = await request.json();
    
    // Validar que tenemos los datos necesarios
    if (!templateId || !fields) {
      return NextResponse.json(
        { error: 'Template ID and fields are required' },
        { status: 400 }
      );
    }

    console.log('Obteniendo template de la base de datos...');
    // Obtener el template de la base de datos
    const supabase = await createClient();
    const { data: template, error } = await supabase
      .from('convenio_types')
      .select('template_content')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      console.error('Error al obtener template:', error);
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    console.log('Creando documento...');
    // Crear el documento usando nuestro servicio
    const doc = createDocument(template.template_content, fields);

    console.log('Generando buffer...');
    // Generar el buffer del documento
    const buffer = await Packer.toBuffer(doc);

    console.log('Subiendo a Drive...');
    try {
      // Subir a Drive
      const driveResponse = await uploadFileToDrive(
        buffer,
        `Convenio_${fields.entidad_nombre}_${new Date().toISOString().split('T')[0]}.docx`
      );

      console.log('Archivo subido exitosamente a Drive');
      
      // Devolver la respuesta como JSON con los datos de Drive
      return NextResponse.json({
        success: true,
        fileId: driveResponse.fileId,
        webViewLink: driveResponse.webViewLink,
        webContentLink: driveResponse.webContentLink
      });
    } catch (driveError) {
      console.error('Error al subir a Drive:', driveError);
      // Si falla la subida a Drive, devolvemos el documento como descarga
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="convenio.docx"`,
        },
      });
    }

  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json(
      { error: 'Error generating document' },
      { status: 500 }
    );
  }
} 
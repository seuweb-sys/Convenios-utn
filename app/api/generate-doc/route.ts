import { NextResponse } from 'next/server';
import { Packer } from 'docx';
import { createClient } from '@/utils/supabase/server';
import { createDocument } from '@/app/lib/utils/doc-generator';

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

    // Obtener el template de la base de datos
    const supabase = await createClient();
    const { data: template, error } = await supabase
      .from('convenio_types')
      .select('template_content')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Crear el documento usando nuestro servicio
    const doc = createDocument(template.template_content, fields);

    // Generar el buffer del documento
    const buffer = await Packer.toBuffer(doc);

    // Devolver el documento como respuesta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="convenio.docx"`,
      },
    });

  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Error generating document' },
      { status: 500 }
    );
  }
} 
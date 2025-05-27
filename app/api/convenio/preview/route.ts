import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { templateId, fields } = await request.json();

    // Obtener el template de la base de datos
    const { data: template, error } = await supabase
      .from('convenio_types')
      .select('template_content')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error al obtener el template:', error);
      return NextResponse.json(
        { error: 'Error al obtener el template' },
        { status: 500 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      templateContent: template.template_content,
      fields
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
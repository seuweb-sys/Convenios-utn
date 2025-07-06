import { NextResponse } from 'next/server';
import { Packer } from 'docx';
import { createClient } from '@/utils/supabase/server';
import { createDocument } from '@/app/lib/utils/doc-generator';
import { uploadFileToDrive } from '@/app/lib/google-drive';
import { NotificationService } from '@/app/lib/services/notification-service';
import path from 'path';
import fs from 'fs';
import { renderDocx } from '@/app/lib/utils/docx-templater';

export async function POST(request: Request) {
  try {
    const { templateId, fields, convenioId } = await request.json();
    
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
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { data: template, error } = await supabase
      .from('convenio_types')
      .select('name, template_content')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      console.error('Error al obtener template:', error);
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Determinar nombre base del template para buscar archivo DOCX (slug sencillo)
    const safeName = (template as any)?.name ? (template as any).name.toString() : '';
    const safeNameLower = safeName.toLowerCase();
    const safeNameNormalized = safeNameLower.normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const templateDir = path.join(process.cwd(), 'templates');

    const slugify = (s: string) =>
      s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const removeStop = (slug: string) => slug.replace(/\b(de|del|la|el|los|las|y|e)\b-/g, '').replace(/-\b(de|del|la|el|los|las|y|e)\b/g, '');

    const targetSlug = removeStop(safeNameNormalized);

    console.log('Convenios API → template.name:', safeName);
    console.log('Convenios API → safeNameNormalized:', safeNameNormalized);
    fs.readdirSync(templateDir).forEach(f => {
      const fileSlug = slugify(path.parse(f).name);
      console.log('Archivo:', f, '→', fileSlug);
    });
    
    const allDocx = fs.readdirSync(templateDir).filter((f) => f.toLowerCase().endsWith('.docx'));
    const scored: {file:string;score:number}[] = [];
    const norm = (s:string)=>s.replace(/-/g,'');
    allDocx.forEach((f)=>{
      const fileSlug = slugify(path.parse(f).name);
      const fileSlugClean = removeStop(fileSlug);
      let score=-1;
      if (fileSlug===safeNameNormalized) score=0;
      else if (fileSlugClean===targetSlug) score=1;
      else if (norm(fileSlug)===norm(safeNameNormalized)) score=2;
      else if (norm(fileSlugClean)===norm(targetSlug)) score=3;
      else if (norm(fileSlug).includes(norm(safeNameNormalized))) score=4;
      else if (norm(fileSlugClean).includes(norm(targetSlug))) score=5;
      if(score>=0) scored.push({file:f,score});
    });
    scored.sort((a,b)=>a.score-b.score||a.file.length-b.file.length);
    const candidateFiles = scored.map((s)=>s.file);

    if (candidateFiles.length) {
      // Usar el primer match
      const filePath = path.join(templateDir, candidateFiles[0]);
      console.log('Usando template DOCX:', filePath);
      const templateBuffer = fs.readFileSync(filePath);
      const rendered = await renderDocx(templateBuffer, fields);

      const fileName = `${safeNameNormalized}-${Date.now()}.docx`;
      try {
        const driveResponse = await uploadFileToDrive(rendered, fileName);
        return NextResponse.json({ success: true, ...driveResponse });
      } catch (driveErr) {
        console.error('Falla al subir a Drive, devolviendo descarga directa');
        return new NextResponse(rendered, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }

    // Si no hay template DOCX, usar generador programático
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
      
      // Enviar notificación de documento generado
      if (convenioId) {
        try {
          const convenioTitle = fields.entidad_nombre || "Sin título";
          await NotificationService.documentGenerated(user.id, convenioTitle, convenioId);
        } catch (notificationError) {
          console.error('Error al enviar notificación de documento generado:', notificationError);
          // No fallamos la operación si la notificación falla
        }
      }
      
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
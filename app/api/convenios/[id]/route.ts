import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { UpdateConvenioDTO } from "@/lib/types/convenio";
import { moveFileToFolder, DRIVE_FOLDERS, uploadFileToDrive, deleteFileFromDrive } from '@/app/lib/google-drive';
import { NotificationService } from '@/app/lib/services/notification-service';
import { renderDocx } from '@/app/lib/utils/docx-templater';
import { createDocument } from '@/app/lib/utils/doc-generator';
import { Packer } from 'docx';
import path from 'path';
import fs from 'fs';

// Obtener un convenio específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar el perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;

    // Obtener el convenio
    const { data: convenio, error: dbError } = await supabase
      .from('convenios')
      .select(`
        *,
        convenio_types(name),
        user:user_id(id, full_name),
        reviewer:reviewer_id(id, full_name)
      `)
      .eq('id', params.id)
      .single();

    if (dbError) {
      console.error('Error al obtener el convenio:', dbError);
      return NextResponse.json(
        { error: 'Error al obtener el convenio' },
        { status: 500 }
      );
    }

    if (!convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga permiso para ver el convenio
    if (
      convenio.user_id !== user.id &&
      userRole !== 'admin' &&
      userRole !== 'profesor'
    ) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver este convenio' },
        { status: 403 }
      );
    }

    return NextResponse.json(convenio);
  } catch (error) {
    console.error('Error al obtener el convenio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Actualizar un convenio
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar el perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;

    // Obtener y validar el body
    const body: UpdateConvenioDTO = await request.json();

    // Verificar que el convenio exista y el usuario tenga permiso
    const { data: convenio, error: checkError } = await supabase
      .from('convenios')
      .select('user_id, status, title')
      .eq('id', params.id)
      .single();

    if (checkError || !convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    // Solo el creador o un admin pueden actualizar el convenio
    if (
      convenio.user_id !== user.id &&
      userRole !== 'admin' &&
      userRole !== 'profesor'
    ) {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar este convenio' },
        { status: 403 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.content_data) {
      updateData.form_data = body.content_data;
    }

    if (body.document_path) {
      updateData.document_path = body.document_path;
    }

    if (body.status) {
      updateData.status = body.status;
      // Si se está enviando el convenio (cambiando a 'enviado'), marcar observaciones como resueltas
      if (body.status === 'enviado' && convenio.status === 'revision') {
        try {
          await supabase
            .from('observaciones')
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq('convenio_id', params.id)
            .eq('resolved', false);
        } catch (observacionError) {
          console.error('Error actualizando observaciones:', observacionError);
          // No fallamos la operación si la actualización de observaciones falla
        }
      }
    }

    // Si se está cambiando el estado, registrar en activity_log
    if (body.status && body.status !== convenio.status) {
      try {
        const action = body.status === 'enviado' && convenio.status === 'revision' 
          ? 'resubmit_convenio' 
          : 'update_status';

        const { error: logError } = await supabase
          .from('activity_log')
          .insert({
            convenio_id: params.id,
            user_id: user.id,
            action,
            status_from: convenio.status,
            status_to: body.status,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            metadata: {
              note: body.status === 'enviado' && convenio.status === 'revision'
                ? 'Reenvío tras correcciones'
                : undefined
            }
          });

        if (logError) {
          console.error('Error al registrar cambio de estado:', logError);
        }
      } catch (logErr) {
        console.error('Error al registrar actividad:', logErr);
        // Continuamos el flujo aunque falle el registro
      }
    }

    // Actualizar el convenio
    const { data: updatedConvenio, error: updateError } = await supabase
      .from('convenios')
      .update(updateData)
      .eq('id', params.id)
      .select('document_path, convenio_type_id')
      .single();

    if (updateError) {
      console.error('Error al actualizar el convenio:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el convenio' },
        { status: 500 }
      );
    }

    // Si se está reenvíando después de corrección, regenerar el documento
    if (body.status === 'enviado' && convenio.status === 'revision' && body.content_data) {
      try {
        // Obtener el template del tipo de convenio
        const { data: template, error: templateError } = await supabase
          .from('convenio_types')
          .select('name, template_content')
          .eq('id', updatedConvenio.convenio_type_id)
          .single();

        if (templateError || !template) {
          console.error('Error al obtener template:', templateError);
          throw new Error('Template no encontrado');
        }

        // Generar documento usando template DOCX
        const formData = body.content_data;
        let buffer: Buffer | null = null;

        try {
          const templateDir = path.join(process.cwd(), 'templates');
          const safeName = template.name ? template.name.toString() : '';
          const safeNameLower = safeName.toLowerCase();
          const safeNameNormalized = safeNameLower.normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          
          const slugify = (str: string) => str.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const removeStop = (str: string) => str.replace(/\b(de|del|la|el|en|con|por|para|y|o|a|un|una)\b/g, '').replace(/-+/g, '-').replace(/(^-|-$)+/g, '');
          const norm = (str: string) => str.replace(/[^a-z0-9]/g, '');
          
          const targetSlug = removeStop(safeNameNormalized);
          const allDocx = fs.readdirSync(templateDir).filter(f => f.endsWith('.docx'));
          const scored: Array<{file: string, score: number}> = [];
          
          allDocx.forEach((f) => {
            const fileSlug = slugify(path.parse(f).name);
            const fileSlugClean = removeStop(fileSlug);
            let score = -1;
            if (fileSlug === safeNameNormalized) score = 0;
            else if (fileSlugClean === targetSlug) score = 1;
            else if (norm(fileSlug) === norm(safeNameNormalized)) score = 2;
            else if (norm(fileSlugClean) === norm(targetSlug)) score = 3;
            else if (norm(fileSlug).includes(norm(safeNameNormalized))) score = 4;
            else if (norm(fileSlugClean).includes(norm(targetSlug))) score = 5;

            if (score >= 0) scored.push({file: f, score});
          });

          scored.sort((a, b) => a.score - b.score || a.file.length - b.file.length);
          const candidateFiles = scored.map((s) => s.file);

          if (candidateFiles.length) {
            const filePath = path.join(templateDir, candidateFiles[0]);
            const templateBuffer = fs.readFileSync(filePath);
            buffer = await renderDocx(templateBuffer, formData);
          }
        } catch (tplErr) {
          console.warn('Fallo al procesar template DOCX:', tplErr);
        }

        // Fallback programático si no hay template DOCX
        if (!buffer) {
          const templateFields = Object.entries(formData).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          const doc = createDocument(template.template_content, templateFields);
          buffer = await Packer.toBuffer(doc);
        }

        if (buffer) {
          // Primero, eliminar el documento viejo de Archivados si existe
          if (updatedConvenio.document_path) {
            try {
              const oldFileId = updatedConvenio.document_path.split('/d/')[1]?.split('/')[0];
              if (oldFileId) {
                await deleteFileFromDrive(oldFileId);
              }
            } catch (deleteError) {
              console.error('Error al eliminar documento viejo:', deleteError);
              // No fallamos la operación si no se puede eliminar el archivo viejo
            }
          }

          // Subir nuevo documento a Drive (automáticamente va a Pendientes)
          const driveResponse = await uploadFileToDrive(
            buffer,
            `Convenio_${body.title || 'Sin_titulo'}_${new Date().toISOString().split('T')[0]}.docx`
          );

          // Actualizar el path del documento en la BD
          const { error: pathUpdateError } = await supabase
            .from('convenios')
            .update({ document_path: driveResponse.webViewLink })
            .eq('id', params.id);

          if (pathUpdateError) {
            console.error('Error al actualizar path del documento:', pathUpdateError);
          }
        }
      } catch (docError) {
        console.error('Error al regenerar documento:', docError);
        // No fallamos la operación si la regeneración falla
      }
    }

    // Enviar notificación de reenvío si se está reenvíando después de corrección
    if (body.status === 'enviado' && convenio.status === 'revision') {
      try {
        const convenioTitle = convenio.title || "Sin título";
        await NotificationService.convenioResubmitted(user.id, convenioTitle, params.id);
      } catch (notificationError) {
        console.error('Error al enviar notificación de reenvío:', notificationError);
        // No fallamos la operación si la notificación falla
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Convenio actualizado exitosamente',
      convenio: updatedConvenio
    });
  } catch (error) {
    console.error('Error al actualizar el convenio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Eliminar un convenio
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar el perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;

    // Verificar que el convenio exista y el usuario tenga permiso
    const { data: convenio, error: checkError } = await supabase
      .from('convenios')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (checkError || !convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    // Solo el creador o un admin pueden eliminar el convenio
    if (
      convenio.user_id !== user.id &&
      userRole !== 'admin' &&
      userRole !== 'profesor'
    ) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este convenio' },
        { status: 403 }
      );
    }

    // Eliminar el convenio
    const { error: deleteError } = await supabase
      .from('convenios')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error al eliminar el convenio:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el convenio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Convenio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el convenio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
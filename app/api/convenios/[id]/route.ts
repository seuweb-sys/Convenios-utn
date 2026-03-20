import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isPracticeType } from '@/app/lib/authz/scope-rules';
import { shouldApplyProfesorPracticeOnlyConvenioFilter } from '@/app/lib/authz/profesor-membership-scope';
import { UpdateConvenioDTO } from "@/lib/types/convenio";
import {
  moveFileToFolderOAuth,
  moveFolderToFolderOAuth,
  DRIVE_FOLDERS,
  uploadFileToOAuthDrive,
  uploadConvenioEspecificoOAuth,
  deleteFileFromOAuthDrive,
  deleteFileFromDrive,
} from '@/app/lib/google-drive';
import { NotificationService } from '@/app/lib/services/notification-service';
import { renderDocx } from '@/app/lib/utils/docx-templater';
import { createDocument } from '@/app/lib/utils/doc-generator';
import { Packer } from 'docx';
import path from 'path';
import fs from 'fs';

async function isSecretaryInScope(supabase: any, userId: string, secretariatId: string | null) {
  if (!secretariatId) return false;
  const { data, error } = await supabase
    .from("profile_memberships")
    .select("id")
    .eq("profile_id", userId)
    .eq("membership_role", "secretario")
    .eq("secretariat_id", secretariatId)
    .eq("is_active", true)
    .limit(1);

  return !error && !!data && data.length > 0;
}

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
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;
    if (!profile.is_approved && userRole !== "admin") {
      return NextResponse.json({ error: "Usuario no aprobado" }, { status: 403 });
    }

    // Obtener el convenio
    const { data: convenio, error: dbError } = await supabase
      .from('convenios')
      .select(`
        *,
        convenio_types(name),
        secretariats:secretariat_id (
          id,
          code,
          name
        ),
        careers:career_id (
          id,
          name,
          code
        ),
        org_units:org_unit_id (
          id,
          code,
          name,
          unit_type
        ),
        user:user_id(id, full_name),
        profiles:user_id(full_name, role),
        reviewer:reviewer_id(id, full_name),
        observaciones (
          id,
          content,
          created_at,
          resolved
        )
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

    const applyProfesorPracticeOnly = await shouldApplyProfesorPracticeOnlyConvenioFilter(
      supabase,
      user.id,
      userRole
    );
    const typeId = (convenio as { convenio_type_id?: number | null }).convenio_type_id;
    if (
      applyProfesorPracticeOnly &&
      typeId != null &&
      !isPracticeType(Number(typeId))
    ) {
      return NextResponse.json(
        { error: 'No autorizado para ver este convenio' },
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
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;
    if (!profile.is_approved && userRole !== "admin") {
      return NextResponse.json({ error: "Usuario no aprobado" }, { status: 403 });
    }

    if (userRole === "decano") {
      return NextResponse.json(
        { error: "El decano tiene permisos de solo lectura" },
        { status: 403 }
      );
    }

    // Obtener y validar el body de la request
    const body = await request.json() as any; // Usar any para flexibilidad con anexos

    let updateData: any = {};

    // Verificar que el convenio exista y el usuario tenga permiso
    const { data: convenio, error: checkError } = await supabase
      .from('convenios')
      .select('user_id, status, title, convenio_type_id, secretariat_id')
      .eq('id', params.id)
      .single();

    if (checkError || !convenio) {
      return NextResponse.json(
        { error: 'Convenio no encontrado' },
        { status: 404 }
      );
    }

    const isOwner = convenio.user_id === user.id;
    const isAdmin = userRole === "admin";
    const hiddenOnlyUpdate =
      Object.keys(body).length > 0 &&
      Object.keys(body).every((k) => k === "is_hidden_from_area");

    let canUpdate = isOwner || isAdmin;

    if (!canUpdate && hiddenOnlyUpdate) {
      if (userRole === "decano") {
        canUpdate = true;
      } else {
        canUpdate = await isSecretaryInScope(supabase, user.id, convenio.secretariat_id || null);
      }
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este convenio" },
        { status: 403 }
      );
    }

    // R9: Validación de fechas para Convenio Específico (type_id 4) al actualizar a 'enviado'
    if (convenio.convenio_type_id === 4 && body.status === 'enviado' && body.content_data) {
      const formData = body.content_data;
      const marcoFecha = formData.convenio_marco_fecha;
      const dia = formData.dia;
      const mes = formData.mes;

      if (marcoFecha && dia && mes) {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const marco = new Date(marcoFecha);
        const mesIdx = meses.indexOf(mes);
        const diaNum = parseInt(dia, 10);

        if (!isNaN(marco.getTime()) && mesIdx >= 0 && !isNaN(diaNum)) {
          const fechaFirma = new Date(marco.getFullYear(), mesIdx, diaNum);

          if (fechaFirma < marco) {
            console.error('❌ [API PATCH] Validación de fechas fallida: fecha de firma anterior al marco');
            return NextResponse.json(
              { error: 'La fecha de firma del Convenio Específico no puede ser anterior a la fecha del Convenio Marco' },
              { status: 400 }
            );
          }
          console.log('✅ [API PATCH] Validación de fechas OK');
        }
      }
    }

    // Preparar datos de actualización
    updateData.updated_at = new Date().toISOString();

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

    if (hiddenOnlyUpdate) {
      updateData.is_hidden_from_area = body.is_hidden_from_area === true;
      updateData.hidden_set_by = user.id;
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

    const isResubmissionAfterCorrection = body.status === 'enviado' && convenio.status === 'revision';
    const isConvenioEspecifico = updatedConvenio.convenio_type_id === 4;
    let latestDocumentPath: string | null = updatedConvenio.document_path;
    let uploadedDirectlyToPending = false;

    const extractDriveItemId = (documentPath: string, isFolder: boolean) => {
      if (isFolder) return documentPath.split('/folders/')[1]?.split('?')[0] ?? null;
      return documentPath.split('/d/')[1]?.split('/')[0] ?? null;
    };

    // Si se está reenvíando después de corrección, regenerar el documento
    if (isResubmissionAfterCorrection && body.content_data) {
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
          const scored: Array<{ file: string, score: number }> = [];

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

            if (score >= 0) scored.push({ file: f, score });
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
          if (latestDocumentPath) {
            try {
              const oldItemId = extractDriveItemId(latestDocumentPath, isConvenioEspecifico);
              if (oldItemId) {
                try {
                  console.log('🗑️ [Update] Eliminando documento viejo con OAuth:', oldItemId);
                  await deleteFileFromOAuthDrive(oldItemId);
                } catch (oauthDeleteError) {
                  console.warn('⚠️ [Update] Falló borrado OAuth, usando fallback Service Account:', oauthDeleteError);
                  await deleteFileFromDrive(oldItemId);
                }
              }
            } catch (deleteError) {
              console.error('Error al eliminar documento viejo:', deleteError);
              // No fallamos la operación si no se puede eliminar el archivo viejo
            }
          }

          // Subir nuevo documento según el tipo
          let driveResponse: { webViewLink?: string | null } | null = null;

          if (isConvenioEspecifico) {
            console.log('📁 [Update] Regenerando convenio específico con carpeta...');

            // Preparar anexos si existen en body
            const anexos = [];
            if (body.anexos && Array.isArray(body.anexos)) {
              console.log('📎 [Update] Procesando anexos...', body.anexos.length);

              for (const anexo of body.anexos) {
                if (anexo.name && anexo.buffer) {
                  try {
                    // Convertir a ArrayBuffer según el tipo de entrada
                    let buffer;
                    if (Array.isArray(anexo.buffer)) {
                      buffer = new Uint8Array(anexo.buffer).buffer;
                    } else if (anexo.buffer instanceof ArrayBuffer) {
                      buffer = anexo.buffer;
                    } else {
                      // Intentar convertir desde Buffer u otro formato
                      buffer = new Uint8Array(anexo.buffer).buffer;
                    }

                    anexos.push({
                      name: anexo.name,
                      buffer: buffer
                    });

                    console.log(`✅ [Update] Anexo procesado: ${anexo.name}`);
                  } catch (bufferError) {
                    console.error(`❌ [Update] Error procesando anexo ${anexo.name}:`, bufferError);
                  }
                }
              }
            }

            console.log(`📎 [Update] Anexos procesados: ${anexos.length}`);

            // Regenerar en Drive con OAuth (misma estrategia que POST)
            const convenioName = `Convenio_${body.title || 'Sin_titulo'}_${new Date().toISOString().split('T')[0]}`;
            driveResponse = await uploadConvenioEspecificoOAuth(
              buffer,
              convenioName,
              anexos,
              DRIVE_FOLDERS.PENDING
            );

            console.log('✅ [Update] Convenio específico regenerado en carpeta:', driveResponse);
          } else {
            console.log('📄 [Update] Regenerando convenio normal...');

            // Regenerar en Drive con OAuth para mantener paridad con el alta
            driveResponse = await uploadFileToOAuthDrive(
              buffer,
              `Convenio_${body.title || 'Sin_titulo'}_${new Date().toISOString().split('T')[0]}.docx`,
              DRIVE_FOLDERS.PENDING,
              false
            );

            console.log('✅ [Update] Convenio normal regenerado:', driveResponse);
          }

          if (typeof driveResponse?.webViewLink === 'string') {
            latestDocumentPath = driveResponse.webViewLink;
            uploadedDirectlyToPending = true;
            updatedConvenio.document_path = driveResponse.webViewLink;

            // Actualizar el path del documento en la BD
            const { error: pathUpdateError } = await supabase
              .from('convenios')
              .update({ document_path: driveResponse.webViewLink })
              .eq('id', params.id);

            if (pathUpdateError) {
              console.error('Error al actualizar path del documento:', pathUpdateError);
            }
          }
        }
      } catch (docError) {
        console.error('Error al regenerar documento:', docError);
        // No fallamos la operación si la regeneración falla
      }
    }

    // Mover archivo/carpeta de vuelta a pendientes si se reenvía después de corrección
    if (isResubmissionAfterCorrection && latestDocumentPath) {
      try {
        if (uploadedDirectlyToPending) {
          console.log('✅ [Update] Convenio ya subido directamente en pendientes; se omite movimiento adicional.');
        } else {
          console.log('📋 [Update] Moviendo convenio corregido de vuelta a pendientes...');

          const itemId = extractDriveItemId(latestDocumentPath, isConvenioEspecifico);

          if (itemId) {
            // Usar función apropiada según el tipo
            if (isConvenioEspecifico) {
              console.log('📁 [Update] Moviendo carpeta de convenio específico a pendientes...');
              await moveFolderToFolderOAuth(itemId, DRIVE_FOLDERS.PENDING);
            } else {
              console.log('📄 [Update] Moviendo archivo de convenio normal a pendientes...');
              await moveFileToFolderOAuth(itemId, DRIVE_FOLDERS.PENDING);
            }
            console.log('✅ [Update] Convenio movido exitosamente a pendientes');
          }
        }
      } catch (driveError) {
        console.error('Error al mover convenio de vuelta a pendientes:', driveError);
        // No fallamos la operación si el movimiento en Drive falla
      }
    }

    // Enviar notificación de reenvío si se está reenvíando después de corrección
    if (isResubmissionAfterCorrection) {
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
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario' },
        { status: 500 }
      );
    }

    const userRole = profile.role;
    if (!profile.is_approved && userRole !== "admin") {
      return NextResponse.json({ error: "Usuario no aprobado" }, { status: 403 });
    }

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
      userRole !== 'admin'
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
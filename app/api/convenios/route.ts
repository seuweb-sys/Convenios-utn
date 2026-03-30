export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { CreateConvenioDTO } from "@/lib/types/convenio";
import { Packer } from 'docx';
import { createDocument } from '@/app/lib/utils/doc-generator';
import { renderDocx } from '@/app/lib/utils/docx-templater';
import {
  uploadFileToDrive,
  uploadConvenioEspecificoSimple,
  // Nuevas funciones OAuth
  uploadFileToOAuthDrive,
  uploadConvenioEspecificoOAuth
} from '@/app/lib/google-drive';
import { NotificationService } from '@/app/lib/services/notification-service';
import { normalizeAgreementYear, validatePracticeHistoricalRule } from '@/app/lib/authz/scope-rules';
import {
  computeConstrainedClassification,
  validateCreateClassification,
  type MembershipRow,
} from '@/app/lib/authz/classification-scope';
import {
  getPracticeConvenioTypeIds,
  shouldApplyProfesorPracticeOnlyConvenioFilter,
} from '@/app/lib/authz/profesor-membership-scope';
import {
  getCareerIdsForMembershipRole,
  getProfileIdsWithMembershipInSecretariats,
  getSecretariatIdsForSecretario,
  hasActiveMembershipRole,
} from '@/app/lib/authz/membership-scope';
import path from 'path';
import fs from 'fs';

interface TemplateField {
  key: string;
  value: string;
}

// Definimos la estructura de los datos que esperamos de Supabase
interface ConvenioFromDB {
  id: string;
  title: string;
  status: string;
  created_at: string;
  convenio_type_id: number;
  convenio_types: {
    name: string;
  } | null;
}

// Helper function para mapear convenio_type_id a nombres correctos
function getConvenioTypeName(typeId: number | null, dbName?: string): string {
  const typeMap: Record<number, string> = {
    1: "Convenio Particular de Práctica Supervisada",
    2: "Convenio Marco",
    3: "Acuerdo de Colaboración",
    4: "Convenio Específico",
    5: "Convenio Marco Práctica Supervisada"
  };

  if (typeId && typeMap[typeId]) {
    return typeMap[typeId];
  }

  return dbName || "Sin tipo";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Obtener y validar el usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("API Error getting user:", userError);
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Obtener el perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo obtener el perfil del usuario' }, { status: 500 });
    }

    // Verificar que el usuario esté aprobado (o sea admin)
    if (!profile.is_approved && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Usuario no aprobado' }, { status: 403 });
    }

    const applyProfesorPracticeOnly = await shouldApplyProfesorPracticeOnlyConvenioFilter(
      supabase,
      user.id,
      profile.role
    );

    // 3. Filtros de query
    const searchParams = request.nextUrl.searchParams;
    const scopeParam = searchParams.get('scope'); // director | secretario | profesor
    const authorMembershipParam = searchParams.get('author_membership'); // director | profesor (vista secretario)
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const secretariatParam = searchParams.get('secretariat');
    const careerParam = searchParams.get('career');
    const orgUnitParam = searchParams.get('org_unit');
    const yearParam = searchParams.get('year');
    const mineOnly = searchParams.get('mine') === 'true';

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Parámetro limit inválido' }, { status: 400 });
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'Parámetro offset inválido' }, { status: 400 });
    }

    // 4. Consulta base (RLS resuelve visibilidad final)
    let query = supabase
      .from('convenios')
      .select(`
        *,
        profiles:user_id (
          full_name,
          role,
          career_id
        ),
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
        observaciones (
          id,
          content,
          created_at,
          resolved
        )
      `)
      .order('updated_at', { ascending: false });

    let emptyResult = false;

    // Paneles por membresía (scope) — validación + filtros acotados
    if (scopeParam === 'director') {
      if (!(await hasActiveMembershipRole(supabase, user.id, 'director'))) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const careerIds = await getCareerIdsForMembershipRole(supabase, user.id, 'director');
      if (careerIds.length === 0) {
        emptyResult = true;
      } else {
        query = query.in('career_id', careerIds);
      }
    } else if (scopeParam === 'secretario') {
      if (!(await hasActiveMembershipRole(supabase, user.id, 'secretario'))) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const secIds = await getSecretariatIdsForSecretario(supabase, user.id);
      if (secIds.length === 0) {
        emptyResult = true;
      } else {
        query = query.in('secretariat_id', secIds);
      }
    } else if (scopeParam === 'profesor') {
      if (!(await hasActiveMembershipRole(supabase, user.id, 'profesor'))) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      query = query.in('convenio_type_id', getPracticeConvenioTypeIds());
      const careerIds = await getCareerIdsForMembershipRole(supabase, user.id, 'profesor');
      if (careerIds.length === 0) {
        emptyResult = true;
      } else {
        query = query.in('career_id', careerIds);
      }
    } else if (applyProfesorPracticeOnly) {
      // Profesores por membresía (sin scope de panel): solo práctica supervisada (tipos 1 y 5)
      query = query.in('convenio_type_id', getPracticeConvenioTypeIds());
    }

    // Secretario: filtrar por autor con membresía director/profesor en mis secretarías
    if (
      !emptyResult &&
      (authorMembershipParam === 'director' || authorMembershipParam === 'profesor') &&
      (!scopeParam || scopeParam === 'secretario')
    ) {
      if (!(await hasActiveMembershipRole(supabase, user.id, 'secretario'))) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const secIds = await getSecretariatIdsForSecretario(supabase, user.id);
      const authorIds = await getProfileIdsWithMembershipInSecretariats(
        supabase,
        authorMembershipParam,
        secIds
      );
      if (authorIds.length === 0) {
        emptyResult = true;
      } else {
        query = query.in('user_id', authorIds);
      }
    }

    // Filtro por status
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    // Filtro por tipo (acepta id numérico o nombre)
    if (typeParam && typeParam !== 'all') {
      const typeId = parseInt(typeParam, 10);
      if (!isNaN(typeId)) {
        query = query.eq('convenio_type_id', typeId);
      } else {
        query = query.eq('convenio_types.name', typeParam);
      }
    }

    if (secretariatParam && secretariatParam !== 'all') {
      query = query.eq('secretariat_id', secretariatParam);
    }
    if (careerParam && careerParam !== 'all') {
      query = query.eq('career_id', careerParam);
    }
    if (orgUnitParam && orgUnitParam !== 'all') {
      query = query.eq('org_unit_id', orgUnitParam);
    }
    if (yearParam && yearParam !== 'all') {
      const parsedYear = parseInt(yearParam, 10);
      if (isNaN(parsedYear)) {
        return NextResponse.json({ error: 'Parámetro year inválido' }, { status: 400 });
      }
      query = query.eq('agreement_year', parsedYear);
    }

    if (mineOnly) {
      query = query.eq('user_id', user.id);
    }

    // Paginación
    if (!emptyResult) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error: dbError } = emptyResult
      ? { data: [] as any[], error: null }
      : await query;
    if (dbError) {
      console.error("API Error fetching convenios:", dbError);
      return NextResponse.json({ error: 'Error al obtener convenios', details: dbError.message }, { status: 500 });
    }

    const filteredData = data || [];

    // 5. Datos completos
    const full = searchParams.get('full') === 'true';
    if (full) return NextResponse.json(filteredData);

    // 6. Formato resumido (default)
    const responseData = (filteredData as unknown as ConvenioFromDB[]).map(convenio => {
      // Formatear fecha de forma más robusta
      let formattedDate = "Sin fecha";
      try {
        const date = new Date(convenio.created_at);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }

      return {
        id: convenio.id,
        title: convenio.title || "Sin título",
        date: formattedDate,
        type: getConvenioTypeName(convenio.convenio_type_id, convenio.convenio_types?.name),
        status: convenio.status || "Desconocido",
        serial_number: (convenio as any).serial_number || null,
        secretariat: (convenio as any).secretariats?.name || null,
        career: (convenio as any).careers?.name || null,
        agreement_year: (convenio as any).agreement_year || null
      };
    });

    // 7. Devolver los datos
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para generar número de serie por año lógico
async function generateSerialNumber(supabase: any, targetYear: number) {
  const { data, error } = await supabase.rpc("generate_serial_number_for_year", {
    target_year: targetYear,
  });

  if (!error && data) {
    return data as string;
  }

  // Fallback defensivo por si la función aún no está desplegada
  const { data: lastConvenio } = await supabase
    .from("convenios")
    .select("serial_number")
    .like("serial_number", `${targetYear}-%`)
    .order("serial_number", { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastConvenio?.serial_number) {
    const [year, number] = String(lastConvenio.serial_number).split("-");
    if (year === String(targetYear)) {
      nextNumber = parseInt(number, 10) + 1;
    }
  }

  return `${targetYear}-${nextNumber.toString().padStart(3, "0")}`;
}

async function canSetHiddenFromArea(
  supabase: any,
  userId: string,
  role: string,
  secretariatId: string | null
) {
  if (!secretariatId) return false;
  if (role === "admin" || role === "decano") return true;

  try {
    const { data, error } = await supabase
      .from("profile_memberships")
      .select("id")
      .eq("profile_id", userId)
      .eq("membership_role", "secretario")
      .eq("secretariat_id", secretariatId)
      .eq("is_active", true)
      .limit(1);

    return !error && !!data && data.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
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

    // Obtener el perfil del usuario para el nombre y verificación
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role, is_approved, career_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil del usuario:', profileError);
      return NextResponse.json({ error: 'No se pudo obtener el perfil del usuario' }, { status: 500 });
    }

    // Verificar que el usuario esté aprobado (o sea admin)
    if (!userProfile.is_approved && userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Usuario no aprobado' }, { status: 403 });
    }

    if (userProfile.role === "decano") {
      return NextResponse.json(
        { error: "El decano tiene permisos de solo lectura" },
        { status: 403 }
      );
    }

    // Obtener y validar el body
    const body = await request.json() as any; // mantener flexibilidad

    const secretariatId = body.secretariat_id || null;
    const careerId = body.career_id || null;
    const orgUnitId = body.org_unit_id || null;
    const hiddenRequested = body.is_hidden_from_area === true;
    const currentYear = new Date().getFullYear();

    // Permitimos tanto form_data (nuevo) como content_data (compatibilidad)
    const formData = body.form_data || body.content_data;
    console.log('📥 [API] Datos recibidos en form_data:', formData);
    if (!formData || Object.keys(formData).length === 0) {
      console.warn('⚠️ [API] form_data está vacío!');
    }
    const templateSlug = body.template_slug; // NUEVO: Recibimos el slug

    // Aplicar fallbacks para campos críticos
    const title = body.title || formData?.entidad_nombre || "Convenio Sin Título";

    // TRIPLE SISTEMA DE FALLBACK - A PRUEBA DE FALLOS
    let finalTemplateSlug = templateSlug;
    if (!finalTemplateSlug) {
      console.warn('⚠️ [API] templateSlug no definido, activando sistema de respaldo...');

      // BACKUP 1: Usar el campo convenio_type enviado explícitamente
      const explicitType = body.convenio_type;
      if (explicitType) {
        const TYPE_TO_SLUG_MAPPING: { [key: string]: string } = {
          'marco': 'nuevo-convenio-marco',                          // ID: 2
          'practica-marco': 'nuevo-convenio-marco-practica-supervisada', // ID: 5
          'especifico': 'nuevo-convenio-especifico',                // ID: 4
          'particular': 'nuevo-convenio-particular-de-practica-supervisada', // ID: 1
          'acuerdo': 'nuevo-acuerdo-de-colaboracion'                // ID: 3
        };

        finalTemplateSlug = TYPE_TO_SLUG_MAPPING[explicitType];
        if (finalTemplateSlug) {
          console.log(`🎯 [API] BACKUP 1 - Tipo explícito: ${explicitType} -> ${finalTemplateSlug}`);
        }
      }

      // BACKUP 2: Analizar URL de referencia
      if (!finalTemplateSlug) {
        const referrerUrl = request.headers.get('referer') || '';
        console.log(`🔍 [API] BACKUP 2 - Referrer URL: ${referrerUrl}`);

        if (referrerUrl.includes('type=practica-marco')) {
          finalTemplateSlug = 'nuevo-convenio-marco-practica-supervisada';
          console.log(`🎯 [API] BACKUP 2 - Detectado practica-marco desde URL`);
        } else if (referrerUrl.includes('type=especifico')) {
          finalTemplateSlug = 'nuevo-convenio-especifico';
        } else if (referrerUrl.includes('type=particular')) {
          finalTemplateSlug = 'nuevo-convenio-particular-de-practica-supervisada';
        } else if (referrerUrl.includes('type=acuerdo')) {
          finalTemplateSlug = 'nuevo-acuerdo-de-colaboracion';
        } else if (referrerUrl.includes('type=marco')) {
          finalTemplateSlug = 'nuevo-convenio-marco';
        }
      }

      // BACKUP 3: Último recurso
      if (!finalTemplateSlug) {
        console.log(`🚨 [API] BACKUP 3 - Usando último recurso: convenio-marco`);
        finalTemplateSlug = 'nuevo-convenio-marco';
      }
    }

    if (!title || !finalTemplateSlug || !formData) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!finalTemplateSlug) missingFields.push('template_slug');
      if (!formData) missingFields.push('form_data');

      console.error('❌ [API] Campos faltantes después de fallbacks:', missingFields);
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // MAPEO CORREGIDO: Basado en la base de datos real
    const TEMPLATE_MAPPING: { [key: string]: number } = {
      // Convenio Marco (ID: 2)
      'nuevo-convenio-marco': 2,
      'convenio-marco': 2,
      'marco': 2,

      // Convenio Marco Práctica Supervisada (ID: 5)
      'nuevo-convenio-marco-practica-supervisada': 5,
      'convenio-marco-practica-supervisada': 5,
      'convenio-practica-marco': 5,
      'practica-marco': 5,

      // Convenio Específico (ID: 4)
      'nuevo-convenio-especifico': 4,
      'convenio-especifico': 4,
      'especifico': 4,

      // Convenio Particular de Práctica Supervisada (ID: 1) ← CORREGIDO
      'nuevo-convenio-particular-de-practica-supervisada': 1,
      'convenio-particular-de-practica-supervisada': 1,
      'convenio-particular': 1,
      'particular': 1,

      // Acuerdo de Colaboración (ID: 3) ← CORREGIDO
      'nuevo-acuerdo-de-colaboracion': 3,
      'acuerdo-de-colaboracion': 3,
      'acuerdo-colaboracion': 3,
      'acuerdo': 3
    };

    const convenioTypeId = TEMPLATE_MAPPING[finalTemplateSlug];

    if (!convenioTypeId) {
      console.error(`Template slug no reconocido: ${finalTemplateSlug}`);
      console.error(`Slugs disponibles:`, Object.keys(TEMPLATE_MAPPING));
      return NextResponse.json(
        { error: `Template no soportado: ${finalTemplateSlug}` },
        { status: 400 }
      );
    }

    console.log(`✅ Mapeo directo: ${finalTemplateSlug} -> tipo ${convenioTypeId}`);

    // Scope/identificadores obligatorios para convenios nuevos clasificados
    if (!secretariatId) {
      return NextResponse.json(
        { error: "Debe seleccionar la secretaría a la que pertenece el convenio" },
        { status: 400 }
      );
    }

    const { data: saRow, error: saErr } = await supabase
      .from("secretariats")
      .select("id")
      .eq("code", "SA")
      .eq("active", true)
      .maybeSingle();
    if (saErr) {
      console.error("secretariat SA lookup", saErr);
      return NextResponse.json({ error: "No se pudo validar el ámbito" }, { status: 500 });
    }
    const { data: memRows, error: memErr } = await supabase
      .from("profile_memberships")
      .select("membership_role, secretariat_id, career_id, org_unit_id, is_active")
      .eq("profile_id", user.id)
      .eq("is_active", true);
    if (memErr) {
      console.error("memberships for classification", memErr);
      return NextResponse.json({ error: "No se pudo validar el ámbito" }, { status: 500 });
    }
    const constrained = computeConstrainedClassification(
      userProfile.role,
      (memRows || []) as MembershipRow[],
      saRow?.id ?? null
    );
    const scopeCheck = validateCreateClassification(
      constrained,
      secretariatId,
      careerId,
      convenioTypeId
    );
    if (!scopeCheck.ok) {
      return NextResponse.json({ error: scopeCheck.error }, { status: 400 });
    }

    const normalizedYear = normalizeAgreementYear(body.agreement_year, currentYear);
    if (!normalizedYear.valid) {
      return NextResponse.json(
        { error: normalizedYear.error },
        { status: 400 }
      );
    }
    const requestedYear = normalizedYear.year;
    const practiceYearValidation = validatePracticeHistoricalRule(convenioTypeId, requestedYear, currentYear);
    if (!practiceYearValidation.valid) {
      return NextResponse.json(
        { error: practiceYearValidation.error },
        { status: 400 }
      );
    }

    const canHide = hiddenRequested
      ? await canSetHiddenFromArea(supabase, user.id, userProfile.role, secretariatId)
      : false;
    if (hiddenRequested && !canHide) {
      return NextResponse.json(
        { error: "No tienes permiso para ocultar convenios al área" },
        { status: 403 }
      );
    }

    // R9: Validación de fechas para Convenio Específico (type_id 4)
    // La fecha de firma del específico no puede ser anterior a la del marco
    if (convenioTypeId === 4) {
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
            console.error('❌ [API] Validación de fechas fallida: fecha de firma anterior al marco');
            return NextResponse.json(
              { error: 'La fecha de firma del Convenio Específico no puede ser anterior a la fecha del Convenio Marco' },
              { status: 400 }
            );
          }
          console.log('✅ [API] Validación de fechas OK');
        }
      }
    }

    let buffer: Buffer | null = null;

    // ---------- Lógica ROBUSTA para encontrar el template DOCX ----------
    try {
      // Remover 'nuevo-' si existe para coincidir con archivos existentes
      let cleanSlug = finalTemplateSlug.replace(/^nuevo-/, '');
      const templateDir = path.join(process.cwd(), 'templates');

      // Mapeo EXACTO de slugs a nombres de archivos
      const TEMPLATE_FILE_MAPPING: { [key: string]: string } = {
        'convenio-marco': 'convenio-marco.docx',
        'convenio-marco-practica-supervisada': 'convenio-marco-practica-supervisada.docx',
        'convenio-especifico': 'convenio-especifico.docx',
        'convenio-particular-de-practica-supervisada': 'convenio-particular-de-practica-supervisada.docx',
        'acuerdo-de-colaboracion': 'acuerdo-de-colaboracion.docx'
      };

      console.log(`🔍 [API] Limpiando slug: ${finalTemplateSlug} -> ${cleanSlug}`);

      // Buscar primero en el mapeo exacto
      let templateFileName = TEMPLATE_FILE_MAPPING[cleanSlug];

      if (!templateFileName) {
        // Fallback: usar el patrón tradicional
        templateFileName = `${cleanSlug}.docx`;
        console.log(`⚠️ [API] Slug no encontrado en mapeo, usando patrón: ${templateFileName}`);
      } else {
        console.log(`✅ [API] Mapeo exacto encontrado: ${cleanSlug} -> ${templateFileName}`);
      }

      const filePath = path.join(templateDir, templateFileName);
      console.log(`🔍 [API] Buscando template: ${filePath}`);

      if (fs.existsSync(filePath)) {
        console.log(`✅ [API] Template encontrado: ${templateFileName}`);
        const templateBuffer = fs.readFileSync(filePath);
        console.log('📋 [API] Procesando template con renderDocx...');

        // POLYFILL: Asegurar que 'partes' exista como array para el template nuevo (con loops)
        // Si vienen datos viejos (planos), los convertimos a un array de 1 elemento.
        if (!formData.partes && (formData.entidad_nombre || formData.empresa_nombre)) {
          console.log('🔄 [API] Adaptando datos legacy a array de partes para template polimórfico');
          formData.partes = [{
            nombre: formData.entidad_nombre || formData.empresa_nombre || '',
            tipo: formData.entidad_tipo || formData.empresa_tipo || '',
            domicilio: formData.entidad_domicilio || formData.empresa_domicilio || '',
            ciudad: formData.entidad_ciudad || formData.empresa_ciudad || '',
            cuit: formData.entidad_cuit || formData.empresa_cuit || '',
            representanteNombre: formData.entidad_representante || formData.representante_nombre || '',
            representanteDni: formData.entidad_dni || formData.representante_dni || '',
            cargoRepresentante: formData.entidad_cargo || formData.representante_cargo || ''
          }];
        }

        // Log para debuggear partes
        if (formData.partes) {
          console.log('📋 [API] FormData tiene partes:', Array.isArray(formData.partes) ? formData.partes.length : 'no-array');
        } else {
          console.log('⚠️ [API] FormData NO tiene partes');
        }
        buffer = await renderDocx(templateBuffer, formData);
        console.log('📤 [API] Buffer generado con tamaño:', buffer?.length);
      } else {
        console.error(`❌ [API] Template no encontrado: ${templateFileName}`);
        // console.error(`❌ [API] Archivos disponibles en templates:`, fs.readdirSync(templateDir));
        // console.error(`❌ [API] Mapeo de archivos:`, TEMPLATE_FILE_MAPPING);
        throw new Error(`No se encontró el template DOCX "${templateFileName}". Asegúrate de que el archivo exista en /templates.`);
      }
    } catch (tplErr) {
      console.log('ℹ️ [API] Saltando procesamiento de archivo físico, intentando generación programática...');
      // console.error('❌ [API] Error al procesar template DOCX:', tplErr);
      // throw new Error('No se pudo procesar el template DOCX. Verifica el archivo.');
    }

    if (!buffer) {
      console.log('⚠️ [API] No se pudo generar buffer desde archivo físico. Intentando fallback programático...');

      // Obtener template de la DB usando el ID que ya determinamos
      const { data: templateDB, error: templateError } = await supabase
        .from('convenio_types')
        .select('template_content')
        .eq('id', convenioTypeId)
        .single();

      if (templateError || !templateDB) {
        console.error('❌ [API] Fallback fallido: No se encontró template en DB', templateError);
        throw new Error('No se pudo generar el documento: template no encontrado en DB ni físico');
      }

      console.log('📋 [API] Generando documento programáticamente con template de DB...');

      try {
        const doc = createDocument(templateDB.template_content, formData);
        buffer = await Packer.toBuffer(doc);
        console.log('✅ [API] Buffer generado programáticamente:', buffer?.length);
      } catch (genError) {
        console.error('❌ [API] Error generando documento programáticamente:', genError);
        throw new Error('Error interno generando el documento');
      }
    }

    if (!buffer) {
      throw new Error('No se pudo generar el documento: buffer vacío después de intentos');
    }

    // Generar número de serie por año lógico
    const serialNumber = await generateSerialNumber(supabase, requestedYear);

    // Primero crear el convenio en la base de datos
    const { data: convenio, error: createError } = await supabase
      .from('convenios')
      .insert({
        title: title, // Usar el título con fallbacks
        convenio_type_id: convenioTypeId, // Usar el ID del mapeo hardcodeado
        form_data: formData,
        status: 'enviado',
        user_id: user.id,
        serial_number: serialNumber,
        secretariat_id: secretariatId,
        career_id: careerId,
        org_unit_id: orgUnitId,
        agreement_year: requestedYear,
        is_hidden_from_area: hiddenRequested && canHide,
        hidden_set_by: hiddenRequested && canHide ? user.id : null,
        legacy_unclassified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        document_path: null // Inicialmente null, se actualizará después de subir a Drive
      })
      .select()
      .single();

    if (createError) {
      console.error('Error al crear convenio:', createError);
      return NextResponse.json(
        { error: "Error al crear el convenio", details: createError.message },
        { status: 500 }
      );
    }

    // Si el convenio se creó exitosamente, subir a Drive
    let documentPath = null;
    try {
      // Detectar si es convenio específico (type_id 4) o convenio marco con anexos (type_id 2)
      const isConvenioEspecifico = convenioTypeId === 4;
      const isConvenioMarcoConAnexos = convenioTypeId === 2 && body.anexos && Array.isArray(body.anexos) && body.anexos.length > 0;

      if (isConvenioEspecifico || isConvenioMarcoConAnexos) {
        const tipoConvenio = isConvenioEspecifico ? 'específico' : 'marco';
        console.log(`📁 [API] Procesando convenio ${tipoConvenio} con carpeta...`);

        // Preparar anexos si existen (con soporte para .docx y .pdf)
        const anexos = [];
        if (body.anexos && Array.isArray(body.anexos)) {
          console.log('📎 [API] Procesando anexos...', body.anexos.length);

          for (const anexo of body.anexos) {
            if (anexo.name && anexo.buffer) {
              console.log(`📎 [API] Procesando anexo: ${anexo.name}`, {
                hasBuffer: !!anexo.buffer,
                bufferType: typeof anexo.buffer,
                bufferLength: anexo.buffer?.length || 0,
                mimeType: anexo.mimeType || 'no especificado'
              });

              try {
                // Convertir array de números a ArrayBuffer si es necesario
                let buffer;
                if (Array.isArray(anexo.buffer)) {
                  buffer = new Uint8Array(anexo.buffer).buffer;
                } else if (anexo.buffer instanceof ArrayBuffer) {
                  buffer = anexo.buffer;
                } else {
                  // Intentar convertir desde otro formato
                  buffer = new Uint8Array(anexo.buffer).buffer;
                }

                anexos.push({
                  name: anexo.name,
                  buffer: buffer,
                  mimeType: anexo.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                });

                console.log(`✅ [API] Anexo procesado: ${anexo.name} (${anexo.mimeType || 'docx'})`);
              } catch (bufferError) {
                console.error(`❌ [API] Error procesando anexo ${anexo.name}:`, bufferError);
              }
            } else {
              console.warn(`⚠️ [API] Anexo inválido (sin name/buffer):`, anexo);
            }
          }
        }

        console.log(`📎 [API] Total anexos procesados: ${anexos.length}`);

        // Usar función OAuth (nueva) - soporta convenio específico y marco con anexos
        const convenioName = `Convenio_${title}_${new Date().toISOString().split('T')[0]}`;
        console.log(`🔐 [API] Usando OAuth para subir convenio ${tipoConvenio}...`);
        const driveResponse = await uploadConvenioEspecificoOAuth(
          buffer as Buffer,
          convenioName,
          anexos
        );

        documentPath = driveResponse.webViewLink; // Enlace a la carpeta

        console.log(`✅ [API] Convenio ${tipoConvenio} subido a carpeta:`, driveResponse);
      } else {
        console.log('📄 [API] Procesando convenio normal (archivo directo)...');

        // Usar función OAuth (nueva) - reemplaza Service Account
        console.log('🔐 [API] Usando OAuth para subir convenio normal...');
        const driveResponse = await uploadFileToOAuthDrive(
          buffer as Buffer,
          `Convenio_${title}_${new Date().toISOString().split('T')[0]}.docx`
        );
        documentPath = driveResponse.webViewLink;

        console.log('✅ [API] Convenio normal subido:', driveResponse);
      }

      // Actualizar el convenio con el path del documento
      const { error: updateError } = await supabase
        .from('convenios')
        .update({ document_path: documentPath })
        .eq('id', convenio.id);

      if (updateError) {
        console.error('Error al actualizar el path del documento:', updateError);
        // No fallamos si la actualización del path falla
      }
    } catch (driveError) {
      console.error('Error al subir a Drive:', driveError);
      // Si falla la subida a Drive, actualizamos el estado del convenio
      const { error: updateError } = await supabase
        .from('convenios')
        .update({
          status: 'borrador',
          document_path: null
        })
        .eq('id', convenio.id);

      if (updateError) {
        console.error('Error al actualizar el estado del convenio:', updateError);
      }

      return NextResponse.json(
        { error: "Error al subir el documento a Drive" },
        { status: 500 }
      );
    }

    // Registrar en activity_log
    try {
      await supabase
        .from('activity_log')
        .insert({
          convenio_id: convenio.id,
          user_id: user.id,
          action: 'create',
          status_from: null,
          status_to: 'enviado',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          metadata: {
            title: body.title,
            type: convenioTypeId,
            document_path: documentPath
          }
        });
    } catch (logError) {
      console.error('Error al registrar actividad:', logError);
      // No fallamos si el log falla
    }

    // Enviar notificación de convenio creado
    try {
      await NotificationService.convenioCreated(user.id, body.title, convenio.id);
    } catch (notificationError) {
      console.error('Error al enviar notificación:', notificationError);
      // No fallamos si la notificación falla
    }

    return NextResponse.json({
      success: true,
      id: convenio.id,
      convenio: {
        ...convenio,
        document_path: documentPath
      }
    });

  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Aquí podrías añadir POST, PUT, DELETE para convenios en el futuro
// export async function POST(request: Request) { ... }
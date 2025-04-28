import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
// Asumimos que estas utilidades no dependen del contexto de React y pueden importarse aquí
// Si dependen de React, habrá que ajustar o no usarlas en la API.
import { getIconForType, getColorForType } from "@/app/lib/dashboard/utils"; 

// Definimos la interfaz aquí también para claridad
export interface ConvenioTypeApiData {
  id: number;
  title: string;
  description: string;
  // Nota: No podemos devolver React Nodes directamente desde una API JSON.
  // Devolveremos identificadores o nombres para que el frontend los use.
  iconName: string; // Ejemplo: 'marco', 'practicas', etc.
  colorName: string; // Ejemplo: 'blue', 'teal', etc.
  previewUrl: string;
}

// Datos de fallback (si no hay nada en la DB)
const defaultConvenioTypes: ConvenioTypeApiData[] = [
  {
    id: 1,
    title: "Convenio Marco",
    description: "Establece lineamientos generales de colaboración institucional.",
    iconName: "marco", // Necesitarás mapear esto a un icono en el frontend
    colorName: "blue", // Necesitarás mapear esto a un color en el frontend
    previewUrl: "/plantillas/marco/preview" // Asegúrate que estas rutas existan
  },
  {
    id: 2,
    title: "Prácticas Profesionales",
    description: "Para realizar prácticas laborales en organizaciones.",
    iconName: "practicas",
    colorName: "teal",
    previewUrl: "/plantillas/practicas/preview"
  },
  {
    id: 3,
    title: "Convenio Específico",
    description: "Para proyectos o actividades específicas.",
    iconName: "especifico",
    colorName: "purple",
    previewUrl: "/plantillas/especifico/preview"
  }
];

export async function GET() {
  const supabase = await createClient();

  // Opcional: Verificar sesión si solo usuarios logueados pueden ver tipos
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  // }

  try {
    const { data, error } = await supabase
      .from('convenio_types')
      .select('id, name, description, active')
      .eq('active', true);

    if (error) {
      console.error("API Error fetching convenio types:", error);
      // Considera no exponer detalles del error al cliente en producción
      return NextResponse.json({ error: 'Error al obtener tipos de convenio', details: error.message }, { status: 500 });
    }

    let responseData: ConvenioTypeApiData[];

    if (!data || data.length === 0) {
      // Si no hay datos, usamos los de fallback
      responseData = defaultConvenioTypes;
    } else {
      // Transformamos los datos de la DB al formato de la API
      // Nota: Ajusta getIconName/getColorName según tu implementación real en utils
      responseData = data.map(type => ({
        id: type.id,
        title: type.name,
        description: type.description || "Sin descripción",
        iconName: type.name.toLowerCase().replace(/ /g, '-'), // Asume un mapeo simple
        colorName: type.name.toLowerCase().replace(/ /g, '-'), // Asume un mapeo simple
        previewUrl: `/protected/convenio-types/${type.id}/preview` // Ajusta si es necesario
      }));
    }

    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error("API Route Exception:", e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 
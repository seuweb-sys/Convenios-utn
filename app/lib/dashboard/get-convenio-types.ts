import { createClient } from "@/utils/supabase/server";
import { getIconForType, getColorForType } from "./utils";

export interface ConvenioTypeData {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  previewUrl: string;
}

export async function getConvenioTypes(): Promise<ConvenioTypeData[]> {
  const supabase = await createClient();
  
  // Consultar tipos de convenio activos
  const { data, error } = await supabase
    .from('convenio_types')
    .select('id, name, description, active')
    .eq('active', true);
    
  if (error) {
    console.error("Error fetching convenio types:", error);
    return [];
  }
  
  // Si no hay tipos de convenio en la base de datos, devolvemos algunos tipos predeterminados
  if (!data || data.length === 0) {
    return [
      {
        id: 1,
        title: "Convenio Marco",
        description: "Establece lineamientos generales de colaboración institucional.",
        icon: getIconForType("Convenio Marco"),
        color: getColorForType("Convenio Marco"),
        previewUrl: "/plantillas/marco/preview"
      },
      {
        id: 2,
        title: "Prácticas Profesionales",
        description: "Para realizar prácticas laborales en organizaciones.",
        icon: getIconForType("Prácticas Profesionales"),
        color: getColorForType("Prácticas Profesionales"),
        previewUrl: "/plantillas/practicas/preview"
      },
      {
        id: 3,
        title: "Convenio Específico",
        description: "Para proyectos o actividades específicas.",
        icon: getIconForType("Convenio Específico"),
        color: getColorForType("Convenio Específico"),
        previewUrl: "/plantillas/especifico/preview"
      }
    ];
  }
  
  // Transformar los datos para el componente
  return data.map(type => ({
    id: type.id,
    title: type.name,
    description: type.description || "Sin descripción",
    icon: getIconForType(type.name),
    color: getColorForType(type.name),
    previewUrl: `/protected/convenio-types/${type.id}/preview`
  }));
} 
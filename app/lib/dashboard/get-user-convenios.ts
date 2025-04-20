import { createClient } from "@/utils/supabase/server";

export interface UserConvenioData {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
}

// Definimos la estructura de los datos que retorna Supabase
interface ConvenioWithType {
  id: string;
  title: string;
  status: string;
  created_at: string;
  convenio_type_id: number;
  convenio_types: {
    name: string;
  };
}

export async function getUserConvenios(limit: number = 4): Promise<UserConvenioData[]> {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  // Consultar convenios del usuario
  const { data, error } = await supabase
    .from('convenios')
    .select(`
      id, 
      title, 
      status, 
      created_at,
      convenio_type_id,
      convenio_types(name)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching user convenios:", error);
    return [];
  }
  
  // Si no hay convenios, devolver array vacío
  if (!data || data.length === 0) {
    return [];
  }
  
  // Transformar los datos para el componente
  return (data as ConvenioWithType[]).map(convenio => {
    return {
      id: convenio.id,
      title: convenio.title,
      date: new Date(convenio.created_at).toLocaleDateString('es-AR'),
      type: convenio.convenio_types?.name || "Sin tipo",
      status: convenio.status
    };
  });
} 
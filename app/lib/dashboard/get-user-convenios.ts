import { createClient } from "@/utils/supabase/server";
import type { ConvenioApiData } from "@/app/api/convenios/route"; // Importar interfaz de la API
import { cookies } from 'next/headers'; // Importar cookies

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

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function getUserConvenios(limit: number = 4): Promise<UserConvenioData[]> {
  const requestHeaders = new Headers();
  try {
    // Usar await y luego getAll()
    const cookieStore = await cookies(); 
    const allCookies = cookieStore.getAll(); 
    allCookies.forEach((cookie: any) => { // Aceptar el 'any' si es necesario
      requestHeaders.append('Cookie', `${cookie.name}=${cookie.value}`);
    });
  } catch (error) {
      console.error("Error al obtener cookies para fetch:", error);
      // Considera qué hacer si no se pueden obtener las cookies. 
      // ¿Devolver [] o intentar el fetch sin cookies?
  }

  try {
    const apiUrl = `${API_BASE_URL}/api/convenios?limit=${limit}`;
    const response = await fetch(apiUrl, {
      headers: requestHeaders, 
    });

    if (!response.ok) { 
      console.error(`API request failed for getUserConvenios with status ${response.status}`);
      const errorBody = await response.text();
      console.error(`Error details: ${errorBody}`);
    return [];
  }
    const apiData: UserConvenioData[] = await response.json();
    return apiData;
  
  } catch (error) {
    console.error("Error fetching user convenios from API:", error);
    return [];
  }
} 
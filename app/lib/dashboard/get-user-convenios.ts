import { cookies } from 'next/headers';
import type { Convenio } from "@/lib/types/convenio";
import { getApiUrl } from "../utils/api";
import { headers } from 'next/headers';

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
  try {
    const headersList = await headers();
    const response = await fetch(getApiUrl(`/api/convenios?limit=${limit}`), {
      headers: {
        'Cookie': headersList.get('cookie') || '',
      },
      cache: 'no-store'
    });

    if (!response.ok) { 
      console.error(`API request failed for getUserConvenios with status ${response.status}`);
      const errorBody = await response.text();
      console.error(`Error details: ${errorBody}`);
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user convenios from API:", error);
    return [];
  }
} 
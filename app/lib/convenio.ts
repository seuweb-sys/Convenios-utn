"use client"; // Podría usarse en cliente

// Asume que la interfaz de la API está definida y exportada
// Importar desde la ruta [id] donde se define la interfaz con 'fields'
import type { ConvenioTypeApiData } from "@/app/api/convenio-types/[id]/route";

// Interfaz para los detalles devueltos (ajusta según tu API)
// Ya tenemos la de la API, pero podríamos definir una específica para el cliente
export interface ConvenioTypeDetails extends ConvenioTypeApiData {
  // Podemos añadir más campos si es necesario
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Obtiene los detalles de un tipo de convenio desde la API.
 * @param typeId - El ID del tipo de convenio.
 * @returns Promise con los detalles del tipo o null si hay error.
 */
export async function getConvenioTypeDetails(typeId: number | string): Promise<ConvenioTypeDetails | null> {
  if (!typeId) {
    console.error("getConvenioTypeDetails: typeId es requerido");
    return null;
  }

  const apiUrl = `${API_BASE_URL}/api/convenio-types/${typeId}`;

  try {
    // Fetch desde el cliente: no pasamos cookies explícitamente
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`API request failed for getConvenioTypeDetails with status ${response.status}`);
      const errorBody = await response.text();
      console.error(`Error details: ${errorBody}`);
      return null; // Devuelve null en caso de error
    }

    const data: ConvenioTypeDetails = await response.json();
    return data;

  } catch (error) {
    console.error("Error fetching convenio type details from API:", error);
    return null; // Devuelve null en caso de excepción
  }
} 
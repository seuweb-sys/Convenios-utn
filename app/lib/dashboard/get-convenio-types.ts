import { createClient } from "@/utils/supabase/server";
import { getIconForType, getColorForType } from "./utils";
import type { ConvenioTypeApiData } from "@/app/api/convenio-types/route";
import { getApiUrl } from "../utils/api";
import { headers } from 'next/headers';

export interface ConvenioTypeData {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  previewUrl: string;
}

// Datos de fallback para asegurar que siempre haya tipos disponibles
const defaultTypes = [
  {
    id: 2,
    title: "Convenio Marco",
    description: "Establece lineamientos generales de colaboración institucional.",
    iconName: "marco",
    colorName: "Convenio Marco",
    previewUrl: "/plantillas/marco/preview"
  },
  {
    id: 5,
    title: "Convenio Marco Práctica Supervisada",
    description: "Establece las condiciones generales para la realización de prácticas supervisadas de estudiantes entre la Facultad y una entidad externa.",
    iconName: "graduation-cap",
    colorName: "Convenio Marco Práctica Supervisada",
    previewUrl: "/plantillas/practica-marco/preview"
  },
  {
    id: 4,
    title: "Convenio Específico",
    description: "Convenio específico para asistencia técnica, colaboración o capacitación entre la Facultad y una entidad externa.",
    iconName: "especifico",
    colorName: "Convenio Específico",
    previewUrl: "/plantillas/especifico/preview"
  },
  {
    id: 1,
    title: "Convenio Particular de Práctica Supervisada",
    description: "Para realizar prácticas laborales supervisadas en organizaciones externas.",
    iconName: "practicas",
    colorName: "Convenio Particular de Práctica Supervisada",
    previewUrl: "/plantillas/practica-particular/preview"
  },
  {
    id: 3,
    title: "Acuerdo de Colaboración",
    description: "Colaboración general entre la Facultad Regional Resistencia y una entidad externa para actividades académicas y técnicas.",
    iconName: "colaboracion",
    colorName: "Acuerdo de Colaboración",
    previewUrl: "/plantillas/acuerdo-colaboracion/preview"
  }
];

export async function getConvenioTypes(): Promise<ConvenioTypeData[]> {
  try {
    const headersList = await headers();
    const response = await fetch(getApiUrl('/api/convenio-types'), {
      headers: {
        'Cookie': headersList.get('cookie') || '',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`API request failed with status ${response.status}, using fallback data`);
      return defaultTypes.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        icon: getIconForType(item.iconName),
        color: getColorForType(item.colorName),
        previewUrl: item.previewUrl
      }));
    }

    const apiData: (ConvenioTypeApiData & { id: number })[] = await response.json();

    if (!apiData || apiData.length === 0) {
      console.warn('No data from API, using fallback data');
      return defaultTypes.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        icon: getIconForType(item.iconName),
        color: getColorForType(item.colorName),
        previewUrl: item.previewUrl
      }));
    }

    return apiData.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      icon: getIconForType(item.iconName),
      color: getColorForType(item.colorName),
      previewUrl: item.previewUrl
    }));

  } catch (error) {
    console.error("Error fetching convenio types from API:", error);
    console.warn('Using fallback data due to error');
    return defaultTypes.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      icon: getIconForType(item.iconName),
      color: getColorForType(item.colorName),
      previewUrl: item.previewUrl
    }));
  }
} 
import { createClient } from "@/utils/supabase/server";
import { getIconForType, getColorForType } from "./utils";
import type { ConvenioTypeApiData } from "@/app/api/convenio-types/route";

export interface ConvenioTypeData {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  previewUrl: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function getConvenioTypes(): Promise<ConvenioTypeData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/convenio-types`);

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      return [];
    }

    const apiData: (ConvenioTypeApiData & { id: number })[] = await response.json();

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
    return [];
  }
} 
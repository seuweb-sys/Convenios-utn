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
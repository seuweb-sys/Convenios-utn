import { getIconByName } from "./utils";
import { ReactNode } from "react";
import type { ActivityApiData } from "@/app/api/activity/route";
import { headers } from 'next/headers';
import { getApiUrl } from "../utils/api";

export interface ActivityData {
  title: string;
  description: string;
  time: string;
  type: ActivityType;
  icon: React.ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type ActivityType = "info" | "success" | "warning" | "error";

function mapActionToType(action: string): ActivityType {
  switch (action) {
    case "created":
    case "nuevo":
      return "info";
    case "aceptado":
      return "success";
    case "warning":
    case "observado":
      return "warning";
    case "rejected":
    case "error":
      return "error";
    default:
      return "info";
  }
}

export async function getRecentActivity(limit: number = 3): Promise<ActivityData[]> {
  try {
    const headersList = await headers();
    const response = await fetch(getApiUrl(`/api/activity?limit=${limit}`), {
      headers: {
        'Cookie': headersList.get('cookie') || '',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      return [];
    }

    const data: ActivityApiData[] = await response.json();
    
    // Los datos ya vienen formateados desde la API, solo necesitamos agregar el icono
    return data.map((item) => ({
      title: item.title,
      description: item.description,
      time: item.time,
      type: item.type,
      icon: getIconByName(item.iconName)
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
} 
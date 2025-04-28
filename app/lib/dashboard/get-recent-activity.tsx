import { formatTimeAgo, getIconByName } from "./utils";
import { FileTextIcon, ClockIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { ReactNode } from "react";
import type { ActivityApiData, ApiActivityType } from "@/app/api/activity/route";
import { cookies } from 'next/headers';

export interface ActivityData {
  title: string;
  description: string;
  time: string;
  type: ApiActivityType;
  icon: ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function getRecentActivity(limit: number = 3): Promise<ActivityData[]> {
  const requestHeaders = new Headers();
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie: any) => {
      requestHeaders.append('Cookie', `${cookie.name}=${cookie.value}`);
    });
  } catch (error) {
    console.error("Error al obtener cookies para fetch (activity):", error);
  }

  try {
    const apiUrl = `${API_BASE_URL}/api/activity?limit=${limit}`;
    const response = await fetch(apiUrl, {
      headers: requestHeaders,
    });

    if (!response.ok) {
      console.error(`API request failed for getRecentActivity with status ${response.status}`);
      const errorBody = await response.text();
      console.error(`Error details: ${errorBody}`);
      return [];
    }

    const apiData: ActivityApiData[] = await response.json();

    return apiData.map(item => ({
      title: item.title,
      description: item.description,
      time: item.time,
      type: item.type,
      icon: getIconByName(item.iconName)
    }));

  } catch (error) {
    console.error("Error fetching recent activity from API:", error);
    return [];
  }
} 
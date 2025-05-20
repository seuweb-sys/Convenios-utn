import { formatTimeAgo, getIconByName } from "./utils";
import { FileTextIcon, ClockIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { ReactNode } from "react";
import type { ActivityApiData, ApiActivityType } from "@/app/api/activity/route";
import { headers } from 'next/headers';
import { getApiUrl } from "../utils/api";

export interface ActivityData {
  id: string;
  action: string;
  status_from: string | null;
  status_to: string | null;
  created_at: string;
  convenio_title: string;
  convenio_serial: string;
  user_name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
} 
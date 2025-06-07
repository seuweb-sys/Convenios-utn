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
    case "approved":
    case "finalizado":
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

    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      title: item.convenio_title,
      description: `${item.user_name} realizó la acción ${item.action}`,
      time: formatTimeAgo(item.created_at),
      type: mapActionToType(item.action),
      icon: getIconByName(item.action)
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
} 